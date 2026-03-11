import { createContext, useContext, useState, useEffect } from 'react';

const TimezoneContext = createContext();

export const useTimezone = () => {
  const context = useContext(TimezoneContext);
  if (!context) {
    throw new Error('useTimezone must be used within a TimezoneProvider');
  }
  return context;
};

export const TIMEZONES = [
  { id: 'pkt', name: 'Pakistan Time (PKT)', offset: 5, type: 'fixed' },
  { id: 'est', name: 'Eastern Time (EST/EDT)', offset: -5, type: 'us-eastern' },
  { id: 'local', name: 'Local Time', offset: 0, type: 'local' },
  { id: 'utc', name: 'UTC', offset: 0, type: 'utc' },
  { id: 'gmt', name: 'GMT', offset: 0, type: 'utc' },
  { id: 'cst', name: 'Central Time (CST/CDT)', offset: -6, type: 'us-central' },
  { id: 'pst', name: 'Pacific Time (PST/PDT)', offset: -8, type: 'us-pacific' },
  { id: 'jst', name: 'Japan Time (JST)', offset: 9, type: 'fixed' },
  { id: 'hkt', name: 'Hong Kong Time (HKT)', offset: 8, type: 'fixed' },
  { id: 'ist', name: 'India Time (IST)', offset: 5.5, type: 'fixed' },
];

export const TimezoneProvider = ({ children }) => {
  const [selectedTimezone, setSelectedTimezone] = useState('pkt');

  useEffect(() => {
    // Load saved timezone preference
    const savedTimezone = localStorage.getItem('timezone');
    if (savedTimezone) {
      setSelectedTimezone(savedTimezone);
    }
  }, []);

  const changeTimezone = (timezoneId) => {
    setSelectedTimezone(timezoneId);
    localStorage.setItem('timezone', timezoneId);
  };

  const getTimezoneInfo = () => {
    return TIMEZONES.find(tz => tz.id === selectedTimezone) || TIMEZONES[0];
  };

  const convertToTimezone = (date) => {
    const tzInfo = getTimezoneInfo();
    
    // Parse the date properly - handle both strings and Date objects
    let d;
    if (typeof date === 'string') {
      // If it's an ISO string with Z (UTC), parse it correctly
      d = new Date(date);
    } else {
      d = new Date(date);
    }
    
    if (tzInfo.type === 'local') {
      return d;
    }

    // Get UTC time in milliseconds
    const utcTime = d.getTime();
    
    // Convert to target timezone
    const targetTime = new Date(utcTime + (3600000 * tzInfo.offset));
    
    return targetTime;
  };

  const formatDateWithTimezone = (date, formatString = 'MMM dd, yyyy HH:mm') => {
    const convertedDate = convertToTimezone(date);
    
    // convertToTimezone shifts UTC ms by the tz offset, so the UTC
    // fields on the resulting Date object represent the target local time.
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[convertedDate.getUTCMonth()];
    const day   = convertedDate.getUTCDate();
    const year  = convertedDate.getUTCFullYear();
    const hours   = String(convertedDate.getUTCHours()).padStart(2, '0');
    const minutes = String(convertedDate.getUTCMinutes()).padStart(2, '0');
    const seconds = String(convertedDate.getUTCSeconds()).padStart(2, '0');
    
    if (formatString === 'HH:mm:ss') {
      return `${hours}:${minutes}:${seconds}`;
    } else if (formatString === 'HH:mm') {
      return `${hours}:${minutes}`;
    } else if (formatString === 'MMM dd, yyyy HH:mm') {
      return `${month} ${day}, ${year} ${hours}:${minutes}`;
    } else if (formatString === 'MMM dd, yyyy') {
      return `${month} ${day}, ${year}`;
    } else if (formatString === 'MMM dd') {
      return `${month} ${day}`;
    } else if (formatString === 'MMM yy') {
      return `${month} ${String(year).slice(-2)}`;
    }
    
    return `${month} ${day}, ${year} ${hours}:${minutes}`;
  };

  return (
    <TimezoneContext.Provider value={{ 
      selectedTimezone, 
      changeTimezone, 
      getTimezoneInfo,
      convertToTimezone,
      formatDateWithTimezone,
      timezones: TIMEZONES
    }}>
      {children}
    </TimezoneContext.Provider>
  );
};
