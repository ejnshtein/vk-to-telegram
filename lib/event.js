module.exports = class EventEmitter {
    constructor() {
        this.events = {}
    }

    /**
     * Send new event to emmiter
     * @param {String} eventName 
     * @param {any} data
     * @param {Function} callback
     */
    emit(eventName, data, callback) {
        const event = this.events[eventName]
        if (event) {
            event.forEach(fn => fn.call(null, data, callback))
        }
    }

    /**
     * Event listener
     * @param {String} eventName 
     * @param {Function} callback 
     */
    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = []
        }

        this.events[eventName].push(callback)
        return () => {
            this.events[eventName] = this.events[eventName].filter(eventFn => callback !== eventFn)
        }
    }
    clearAll() {
        this.events = {}
    }
}