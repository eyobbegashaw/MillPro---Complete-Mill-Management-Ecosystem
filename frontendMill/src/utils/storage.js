// src/utils/storage.js

// ሁሉንም ተጠቃሚዎች ለማግኘት
// export const getUsers = () => {
//     const users = localStorage.getItem('millpro_users');
//     return users ? JSON.parse(users) : [];
// };

// አዲስ ተጠቃሚ ወይም የተቀየረ መረጃን ሴቭ ለማድረግ
export const saveUsers = (users) => {
    localStorage.setItem('millpro_users', JSON.stringify(users));
};

// የተጠቃሚ ምርጫዎችን (Theme, Language) ለማግኘት
export const getPreferences = () => {
    const prefs = localStorage.getItem('millpro_preferences');
    return prefs ? JSON.parse(prefs) : { theme: 'light', language: 'am' };
};

// ምርጫዎችን ሴቭ ለማድረግ
export const savePreferences = (prefs) => {
    localStorage.setItem('millpro_preferences', JSON.stringify(prefs));
};

// ለሙከራ እንዲሆን (Helper for auth)
export const getCurrentUser = () => {
    const user = localStorage.getItem('millpro_logged_in_user');
    return user ? JSON.parse(user) : null;
};

// ከነበረው ኮድ ቀጥሎ እነዚህን ጨምር
export const getCart = () => JSON.parse(localStorage.getItem('millpro_cart') || '[]');
export const saveCart = (cart) => localStorage.setItem('millpro_cart', JSON.stringify(cart));
export const getSavedItems = () => JSON.parse(localStorage.getItem('millpro_saved') || '[]');
export const saveSavedItems = (items) => localStorage.setItem('millpro_saved', JSON.stringify(items));
export const getUsers = () => JSON.parse(localStorage.getItem('millpro_users') || '[]');