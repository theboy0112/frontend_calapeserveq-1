export const isOfficeHours = () => {
    const now = new Date();
    const hours = now.getHours();

    // Office hours: 8:00 AM to 5:00 PM (17:00)
    // Returns true if current hour is >= 8 and < 17
    return hours >= 8 && hours < 17;
};

export const getOfficeHoursMessage = () => {
    return "Office hours are from 8:00 AM to 5:00 PM. Please come back during operational hours.";
};
