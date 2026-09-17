import axios from 'axios';

const API = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/', // Your Django backend URL
    withCredentials: true,
});

export default API;