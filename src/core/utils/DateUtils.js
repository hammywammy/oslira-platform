// =============================================================================
// DATE UTILS - Date Formatting and Parsing Utilities
// Path: /public/core/utils/DateUtils.js
// Dependencies: None
// =============================================================================

/**
 * @class DateUtils
 * @description Utility functions for date formatting, parsing, and manipulation
 * 
 * Features:
 * - Format dates in multiple formats
 * - Relative time (e.g., "2 hours ago")
 * - Parse various date formats
 * - Date calculations
 * - Timezone handling
 */
class DateUtils {
    constructor() {
        // Month names
        this.monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        this.monthNamesShort = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        
        // Day names
        this.dayNames = [
            'Sunday', 'Monday', 'Tuesday', 'Wednesday',
            'Thursday', 'Friday', 'Saturday'
        ];
        
        this.dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        console.log('📅 [DateUtils] Initialized');
    }
    
    // =========================================================================
    // FORMATTING
    // =========================================================================
    
    /**
     * Format date to readable string
     * @param {Date|string|number} date - Date to format
     * @param {string} format - Format string (default: 'MMM DD, YYYY')
     * @returns {string} Formatted date
     */
    format(date, format = 'MMM DD, YYYY') {
        const d = this.parseDate(date);
        if (!d) return '';
        
        const tokens = {
            YYYY: d.getFullYear(),
            YY: String(d.getFullYear()).slice(-2),
            MMMM: this.monthNames[d.getMonth()],
            MMM: this.monthNamesShort[d.getMonth()],
            MM: String(d.getMonth() + 1).padStart(2, '0'),
            M: d.getMonth() + 1,
            DD: String(d.getDate()).padStart(2, '0'),
            D: d.getDate(),
            dddd: this.dayNames[d.getDay()],
            ddd: this.dayNamesShort[d.getDay()],
            HH: String(d.getHours()).padStart(2, '0'),
            H: d.getHours(),
            hh: String(d.getHours() % 12 || 12).padStart(2, '0'),
            h: d.getHours() % 12 || 12,
            mm: String(d.getMinutes()).padStart(2, '0'),
            m: d.getMinutes(),
            ss: String(d.getSeconds()).padStart(2, '0'),
            s: d.getSeconds(),
            A: d.getHours() >= 12 ? 'PM' : 'AM',
            a: d.getHours() >= 12 ? 'pm' : 'am'
        };
        
        return format.replace(/YYYY|YY|MMMM|MMM|MM|M|DD|D|dddd|ddd|HH|H|hh|h|mm|m|ss|s|A|a/g, match => tokens[match]);
    }
    
    /**
     * Format date to ISO string
     */
    toISO(date) {
        const d = this.parseDate(date);
        return d ? d.toISOString() : '';
    }
    
    /**
     * Format date to short format (MM/DD/YYYY)
     */
    toShort(date) {
        return this.format(date, 'MM/DD/YYYY');
    }
    
    /**
     * Format date to long format (Month DD, YYYY)
     */
    toLong(date) {
        return this.format(date, 'MMMM DD, YYYY');
    }
    
    /**
     * Format date with time (MM/DD/YYYY HH:mm)
     */
    toDateTime(date) {
        return this.format(date, 'MM/DD/YYYY HH:mm');
    }
    
    /**
     * Format time only (HH:mm)
     */
    toTime(date) {
        return this.format(date, 'HH:mm');
    }
    
    /**
     * Format time with AM/PM (h:mm A)
     */
    toTime12(date) {
        return this.format(date, 'h:mm A');
    }
    
    // =========================================================================
    // RELATIVE TIME
    // =========================================================================
    
    /**
     * Get relative time string (e.g., "2 hours ago")
     * @param {Date|string|number} date - Date to compare
     * @param {Date|string|number} baseDate - Base date (default: now)
     * @returns {string} Relative time string
     */
    relative(date, baseDate = null) {
        const d = this.parseDate(date);
        const base = baseDate ? this.parseDate(baseDate) : new Date();
        
        if (!d || !base) return '';
        
        const seconds = Math.floor((base - d) / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);
        
        // Future dates
        if (seconds < 0) {
            const absSeconds = Math.abs(seconds);
            const absMinutes = Math.abs(minutes);
            const absHours = Math.abs(hours);
            const absDays = Math.abs(days);
            const absMonths = Math.abs(months);
            const absYears = Math.abs(years);
            
            if (absSeconds < 60) return 'in a few seconds';
            if (absMinutes < 60) return `in ${absMinutes} ${absMinutes === 1 ? 'minute' : 'minutes'}`;
            if (absHours < 24) return `in ${absHours} ${absHours === 1 ? 'hour' : 'hours'}`;
            if (absDays < 30) return `in ${absDays} ${absDays === 1 ? 'day' : 'days'}`;
            if (absMonths < 12) return `in ${absMonths} ${absMonths === 1 ? 'month' : 'months'}`;
            return `in ${absYears} ${absYears === 1 ? 'year' : 'years'}`;
        }
        
        // Past dates
        if (seconds < 10) return 'just now';
        if (seconds < 60) return `${seconds} seconds ago`;
        if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
        if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
        if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
        if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
        return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
    
    /**
     * Get short relative time (e.g., "2h ago")
     */
    relativeShort(date, baseDate = null) {
        const d = this.parseDate(date);
        const base = baseDate ? this.parseDate(baseDate) : new Date();
        
        if (!d || !base) return '';
        
        const seconds = Math.floor((base - d) / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);
        
        if (seconds < 60) return `${seconds}s`;
        if (minutes < 60) return `${minutes}m`;
        if (hours < 24) return `${hours}h`;
        if (days < 30) return `${days}d`;
        if (months < 12) return `${months}mo`;
        return `${years}y`;
    }
    
    // =========================================================================
    // PARSING
    // =========================================================================
    
    /**
     * Parse date from various formats
     * @param {Date|string|number} input - Date input
     * @returns {Date|null} Parsed date or null
     */
    parseDate(input) {
        if (!input) return null;
        
        // Already a Date object
        if (input instanceof Date) {
            return isNaN(input.getTime()) ? null : input;
        }
        
        // Number (timestamp)
        if (typeof input === 'number') {
            const d = new Date(input);
            return isNaN(d.getTime()) ? null : d;
        }
        
        // String
        if (typeof input === 'string') {
            const d = new Date(input);
            return isNaN(d.getTime()) ? null : d;
        }
        
        return null;
    }
    
    /**
     * Check if value is a valid date
     */
    isValid(date) {
        return this.parseDate(date) !== null;
    }
    
    // =========================================================================
    // CALCULATIONS
    // =========================================================================
    
    /**
     * Add days to date
     */
    addDays(date, days) {
        const d = this.parseDate(date);
        if (!d) return null;
        
        const result = new Date(d);
        result.setDate(result.getDate() + days);
        return result;
    }
    
    /**
     * Add hours to date
     */
    addHours(date, hours) {
        const d = this.parseDate(date);
        if (!d) return null;
        
        const result = new Date(d);
        result.setHours(result.getHours() + hours);
        return result;
    }
    
    /**
     * Add minutes to date
     */
    addMinutes(date, minutes) {
        const d = this.parseDate(date);
        if (!d) return null;
        
        const result = new Date(d);
        result.setMinutes(result.getMinutes() + minutes);
        return result;
    }
    
    /**
     * Add months to date
     */
    addMonths(date, months) {
        const d = this.parseDate(date);
        if (!d) return null;
        
        const result = new Date(d);
        result.setMonth(result.getMonth() + months);
        return result;
    }
    
    /**
     * Add years to date
     */
    addYears(date, years) {
        const d = this.parseDate(date);
        if (!d) return null;
        
        const result = new Date(d);
        result.setFullYear(result.getFullYear() + years);
        return result;
    }
    
    /**
     * Get difference between two dates in days
     */
    diffDays(date1, date2) {
        const d1 = this.parseDate(date1);
        const d2 = this.parseDate(date2);
        
        if (!d1 || !d2) return null;
        
        const diff = Math.abs(d1 - d2);
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }
    
    /**
     * Get difference between two dates in hours
     */
    diffHours(date1, date2) {
        const d1 = this.parseDate(date1);
        const d2 = this.parseDate(date2);
        
        if (!d1 || !d2) return null;
        
        const diff = Math.abs(d1 - d2);
        return Math.floor(diff / (1000 * 60 * 60));
    }
    
    /**
     * Get difference between two dates in minutes
     */
    diffMinutes(date1, date2) {
        const d1 = this.parseDate(date1);
        const d2 = this.parseDate(date2);
        
        if (!d1 || !d2) return null;
        
        const diff = Math.abs(d1 - d2);
        return Math.floor(diff / (1000 * 60));
    }
    
    // =========================================================================
    // COMPARISONS
    // =========================================================================
    
    /**
     * Check if date is before another date
     */
    isBefore(date, compareDate) {
        const d1 = this.parseDate(date);
        const d2 = this.parseDate(compareDate);
        
        if (!d1 || !d2) return false;
        return d1 < d2;
    }
    
    /**
     * Check if date is after another date
     */
    isAfter(date, compareDate) {
        const d1 = this.parseDate(date);
        const d2 = this.parseDate(compareDate);
        
        if (!d1 || !d2) return false;
        return d1 > d2;
    }
    
    /**
     * Check if date is same day as another date
     */
    isSameDay(date1, date2) {
        const d1 = this.parseDate(date1);
        const d2 = this.parseDate(date2);
        
        if (!d1 || !d2) return false;
        
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    }
    
    /**
     * Check if date is today
     */
    isToday(date) {
        return this.isSameDay(date, new Date());
    }
    
    /**
     * Check if date is yesterday
     */
    isYesterday(date) {
        const yesterday = this.addDays(new Date(), -1);
        return this.isSameDay(date, yesterday);
    }
    
    /**
     * Check if date is tomorrow
     */
    isTomorrow(date) {
        const tomorrow = this.addDays(new Date(), 1);
        return this.isSameDay(date, tomorrow);
    }
    
    // =========================================================================
    // START/END OF PERIOD
    // =========================================================================
    
    /**
     * Get start of day
     */
    startOfDay(date) {
        const d = this.parseDate(date);
        if (!d) return null;
        
        const result = new Date(d);
        result.setHours(0, 0, 0, 0);
        return result;
    }
    
    /**
     * Get end of day
     */
    endOfDay(date) {
        const d = this.parseDate(date);
        if (!d) return null;
        
        const result = new Date(d);
        result.setHours(23, 59, 59, 999);
        return result;
    }
    
    /**
     * Get start of month
     */
    startOfMonth(date) {
        const d = this.parseDate(date);
        if (!d) return null;
        
        const result = new Date(d.getFullYear(), d.getMonth(), 1);
        result.setHours(0, 0, 0, 0);
        return result;
    }
    
    /**
     * Get end of month
     */
    endOfMonth(date) {
        const d = this.parseDate(date);
        if (!d) return null;
        
        const result = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        result.setHours(23, 59, 59, 999);
        return result;
    }
    
    /**
     * Get start of year
     */
    startOfYear(date) {
        const d = this.parseDate(date);
        if (!d) return null;
        
        const result = new Date(d.getFullYear(), 0, 1);
        result.setHours(0, 0, 0, 0);
        return result;
    }
    
    /**
     * Get end of year
     */
    endOfYear(date) {
        const d = this.parseDate(date);
        if (!d) return null;
        
        const result = new Date(d.getFullYear(), 11, 31);
        result.setHours(23, 59, 59, 999);
        return result;
    }
    
    // =========================================================================
    // UTILITIES
    // =========================================================================
    
    /**
     * Get current timestamp
     */
    now() {
        return Date.now();
    }
    
    /**
     * Get current date
     */
    today() {
        return new Date();
    }
    
    /**
     * Get yesterday's date
     */
    yesterday() {
        return this.addDays(new Date(), -1);
    }
    
    /**
     * Get tomorrow's date
     */
    tomorrow() {
        return this.addDays(new Date(), 1);
    }
}

// =============================================================================
// GLOBAL EXPORT
// =============================================================================
window.OsliraDateUtils = new DateUtils();

console.log('✅ [DateUtils] Loaded and ready');
