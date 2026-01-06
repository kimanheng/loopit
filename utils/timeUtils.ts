export const isTimeOver = (pickupTime: string): boolean => {
    if (!pickupTime || !pickupTime.includes('-')) return false;

    try {
        if (pickupTime.toLowerCase().includes('tomorrow')) {
            return false;
        }

        const parts = pickupTime.split('-');
        if (parts.length < 2) return false;
        
        const endStr = parts[1].trim(); // "11:00 AM"
        
        const now = new Date();
        const endTime = new Date();
        
        const [time, period] = endStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        endTime.setHours(hours, minutes, 0, 0);
        
        // If end time is earlier than roughly "start of day" (e.g. 3 AM) and now is late, maybe it's next day?
        // But usually pickup times are same day.
        // Assuming same day for simplicity. 
        
        return now > endTime;
    } catch (e) {
        return false;
    }
};
