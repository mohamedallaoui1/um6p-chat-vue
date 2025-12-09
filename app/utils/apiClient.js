// API Client Configuration
const API_BASE_URL = 'https://um6p.cleverlytics.com/api';

/**
 * API Client for handling all HTTP requests
 */
class ApiClient {
    constructor(baseURL = API_BASE_URL) {
        this.baseURL = baseURL;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
    }

    /**
     * Generic request handler
     * @param {string} endpoint - API endpoint path
     * @param {object} options - Fetch options
     * @returns {Promise} Response data
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.defaultHeaders,
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    /**
     * GET request
     * @param {string} endpoint - API endpoint path
     * @param {object} options - Additional fetch options
     */
    async get(endpoint, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'GET',
        });
    }

    /**
     * POST request
     * @param {string} endpoint - API endpoint path
     * @param {object} data - Request body data
     * @param {object} options - Additional fetch options
     */
    async post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * PUT request
     * @param {string} endpoint - API endpoint path
     * @param {object} data - Request body data
     * @param {object} options - Additional fetch options
     */
    async put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    /**
     * PATCH request
     * @param {string} endpoint - API endpoint path
     * @param {object} data - Request body data
     * @param {object} options - Additional fetch options
     */
    async patch(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    /**
     * DELETE request
     * @param {string} endpoint - API endpoint path
     * @param {object} options - Additional fetch options
     */
    async delete(endpoint, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'DELETE',
        });
    }

    /**
     * Set authorization token
     * @param {string} token - Authorization token
     */
    setAuthToken(token) {
        this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    /**
     * Remove authorization token
     */
    removeAuthToken() {
        delete this.defaultHeaders['Authorization'];
    }

    /**
     * Update base URL
     * @param {string} newBaseURL - New base URL
     */
    setBaseURL(newBaseURL) {
        this.baseURL = newBaseURL;
    }
}

// Specific API methods for your chatbot
export const chatAPI = {
    /**
     * Initialize a new conversation
     * @param {object} data - Initialization data
     */
    initializeConversation: async (data) => {
        const client = new ApiClient();
        return client.post('/conversation/initialize', data);
    },

    /**
     * Send a query to the chatbot
     * @param {object} data - Query data including conversation_id and query
     */
    sendQuery: async (data) => {
        const client = new ApiClient();
        return client.post('/query', data);
    },

    /**
     * Get conversation history
     * @param {string} conversationId - Conversation ID
     */
    getConversationHistory: async (conversationId) => {
        const client = new ApiClient();
        return client.get(`/conversation/${conversationId}/history`);
    },

    /**
     * Delete a conversation
     * @param {string} conversationId - Conversation ID
     */
    deleteConversation: async (conversationId) => {
        const client = new ApiClient();
        return client.delete(`/conversation/${conversationId}`);
    },
};

// Create a default instance
const apiClient = new ApiClient();

export default apiClient;
