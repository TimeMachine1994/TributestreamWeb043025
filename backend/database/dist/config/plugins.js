"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    // Users-permissions plugin configuration
    'users-permissions': {
        config: {
            register: {
                // Allow these fields to be received and stored during registration
                allowedFields: ['fullName', 'phoneNumber']
            }
        }
    }
});
