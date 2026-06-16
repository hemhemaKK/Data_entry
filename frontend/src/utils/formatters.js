export const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    if (dateStr.includes('T')) {
        dateStr = dateStr.split('T')[0];
    }
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
};
