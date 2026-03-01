const mongoose = require('mongoose');
const { PAGINATION, SORT_ORDERS } = require('./constants');

class DatabaseUtils {
  // Convert string to ObjectId
  static toObjectId(id) {
    try {
      return mongoose.Types.ObjectId(id);
    } catch (error) {
      return null;
    }
  }

  // Check if string is valid ObjectId
  static isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
  }

  // Build pagination options
  static buildPaginationOptions(page, limit) {
    const pageNum = parseInt(page) || PAGINATION.DEFAULT_PAGE;
    const limitNum = Math.min(
      parseInt(limit) || PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT
    );
    const skip = (pageNum - 1) * limitNum;

    return {
      page: pageNum,
      limit: limitNum,
      skip
    };
  }

  // Build sort options
  static buildSortOptions(sortBy, sortOrder = SORT_ORDERS.DESC) {
    const sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'asc' ? SORT_ORDERS.ASC : SORT_ORDERS.DESC;
    } else {
      sort.createdAt = SORT_ORDERS.DESC;
    }
    return sort;
  }

  // Build date range query
  static buildDateRangeQuery(field, startDate, endDate) {
    const query = {};
    if (startDate || endDate) {
      query[field] = {};
      if (startDate) {
        query[field].$gte = new Date(startDate);
      }
      if (endDate) {
        query[field].$lte = new Date(endDate);
      }
    }
    return query;
  }

  // Build search query
  static buildSearchQuery(fields, searchTerm) {
    if (!searchTerm) return {};
    
    return {
      $or: fields.map(field => ({
        [field]: { $regex: searchTerm, $options: 'i' }
      }))
    };
  }

  // Get pagination metadata
  static getPaginationMetadata(total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    
    return {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  // Build aggregation pipeline for pagination
  static paginationAggregation(pipeline = [], page, limit) {
    const { skip, limit: limitNum } = this.buildPaginationOptions(page, limit);
    
    return [
      ...pipeline,
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [{ $skip: skip }, { $limit: limitNum }]
        }
      },
      {
        $project: {
          data: 1,
          total: { $arrayElemAt: ['$metadata.total', 0] }
        }
      }
    ];
  }

  // Bulk write with error handling
  static async bulkWriteWithRetry(model, operations, options = {}) {
    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await model.bulkWrite(operations, { ordered: false });
        return result;
      } catch (error) {
        if (attempt === maxRetries) throw error;
        
        console.log(`Bulk write attempt ${attempt} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }

  // Get distinct values with counts
  static async getDistinctWithCount(model, field, query = {}) {
    const results = await model.aggregate([
      { $match: query },
      {
        $group: {
          _id: `$${field}`,
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    return results.map(r => ({
      value: r._id,
      count: r.count
    }));
  }

  // Get statistics for numeric field
  static async getFieldStats(model, field, query = {}) {
    const stats = await model.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          min: { $min: `$${field}` },
          max: { $max: `$${field}` },
          avg: { $avg: `$${field}` },
          sum: { $sum: `$${field}` },
          count: { $sum: 1 }
        }
      }
    ]);

    return stats[0] || { min: 0, max: 0, avg: 0, sum: 0, count: 0 };
  }

  // Perform aggregation with pagination
  static async aggregateWithPagination(model, pipeline, page, limit) {
    const paginatedPipeline = this.paginationAggregation(pipeline, page, limit);
    const [result] = await model.aggregate(paginatedPipeline);

    return {
      data: result?.data || [],
      pagination: this.getPaginationMetadata(
        result?.total || 0,
        page,
        limit
      )
    };
  }

  // Check for duplicate before saving
  static async checkDuplicate(model, conditions, excludeId = null) {
    const query = { ...conditions };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const exists = await model.findOne(query);
    return !!exists;
  }

  // Soft delete helper
  static async softDelete(model, id, deletedBy = null) {
    return await model.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy
      },
      { new: true }
    );
  }

  // Restore soft deleted
  static async restore(model, id) {
    return await model.findByIdAndUpdate(
      id,
      {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null
      },
      { new: true }
    );
  }

  // Get next sequence value
  static async getNextSequence(sequenceName) {
    const counter = await mongoose.model('Counter').findOneAndUpdate(
      { name: sequenceName },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );
    
    return counter.value;
  }

  // Build lookup stages for joins
  static buildLookupStage({
    from,
    localField,
    foreignField = '_id',
    as,
    pipeline = []
  }) {
    return {
      $lookup: {
        from,
        let: { [`${localField}`]: `$${localField}` },
        pipeline: [
          {
            $match: {
              $expr: { $eq: [`$${foreignField}`, `$$${localField}`] }
            }
          },
          ...pipeline
        ],
        as: as || localField
      }
    };
  }

  // Get random documents
  static async getRandomDocuments(model, count = 1, query = {}) {
    return await model.aggregate([
      { $match: query },
      { $sample: { size: count } }
    ]);
  }

  // Update or create (upsert) with history
  static async upsertWithHistory(model, query, update, userId = null) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const existing = await model.findOne(query).session(session);

      if (existing) {
        // Create history entry
        if (userId) {
          await mongoose.model('History').create([{
            collection: model.collection.name,
            documentId: existing._id,
            action: 'update',
            changes: update,
            performedBy: userId,
            previousState: existing.toObject()
          }], { session });
        }

        // Update document
        const updated = await model.findOneAndUpdate(
          query,
          { ...update, updatedAt: new Date() },
          { new: true, session }
        );

        await session.commitTransaction();
        return { document: updated, created: false };
      } else {
        // Create new document
        const created = await model.create([{
          ...query,
          ...update,
          createdAt: new Date(),
          updatedAt: new Date()
        }], { session });

        await session.commitTransaction();
        return { document: created[0], created: true };
      }
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

module.exports = DatabaseUtils;