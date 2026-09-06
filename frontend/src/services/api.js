import axios from 'axios';

const isDev = import.meta.env.DEV;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (isDev ? 'http://localhost:8000/api' : 'https://data-entry-ed9f.onrender.com/api');

export const createYear = async (year) => {
  const response = await axios.post(`${API_BASE_URL}/years`, { year });
  return response.data;
};

export const getYears = async () => {
    const response = await axios.get(`${API_BASE_URL}/years`);
    return response.data;
};

export const deleteYear = async (id) => {
  const response = await axios.delete(`${API_BASE_URL}/years/${id}`);
  return response.data;
};

export const updateYear = async (id, year) => {
  const response = await axios.put(`${API_BASE_URL}/years/${id}`, { year });
  return response.data;
};

export const getPlaces = async (yearId, search = "") => {
  const params = { year_id: yearId };
  if (search) params.search = search;
  const response = await axios.get(`${API_BASE_URL}/places`, { params });
  return response.data;
};

export const getPlace = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/places/${id}`);
  return response.data;
};

export const createPlace = async (payload) => {
  const response = await axios.post(`${API_BASE_URL}/places`, payload);
  return response.data;
};

export const updatePlace = async (id, payload) => {
  const response = await axios.put(`${API_BASE_URL}/places/${id}`, payload);
  return response.data;
};

export const deletePlace = async (id) => {
  const response = await axios.delete(`${API_BASE_URL}/places/${id}`);
  return response.data;
};

export const getUsers = async (placeId) => {
    const response = await axios.get(`${API_BASE_URL}/users`, { params: { place_id: placeId } });
    return response.data;
};

// USER CRUD
export const createUser = async (payload) => {
  const response = await axios.post(`${API_BASE_URL}/users`, payload);
  return response.data;
};

export const updateUser = async (id, payload) => {
  const response = await axios.put(`${API_BASE_URL}/users/${id}`, payload);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await axios.delete(`${API_BASE_URL}/users/${id}`);
  return response.data;
};

export const getFlowers = async (userId, params = {}) => {
    const queryParams = { ...params, _t: new Date().getTime() };
    if (userId) queryParams.user_id = userId;
    const response = await axios.get(`${API_BASE_URL}/flowers`, { params: queryParams });
    return response.data;
};

// Flower CRUD
export const createFlower = async (payload) => {
    const response = await axios.post(`${API_BASE_URL}/flowers/`, payload);
    return response.data;
};

export const updateFlower = async (id, payload) => {
    const response = await axios.put(`${API_BASE_URL}/flowers/${id}`, payload);
    return response.data;
};

export const deleteFlower = async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/flowers/${id}`);
    return response.data;
};

export const exportFlowers = async (userId, format) => {
    const response = await axios.get(`${API_BASE_URL}/flowers/export`, { params: { user_id: userId, format }, responseType: 'blob' });
    return response.data;
};

export const dashboardApi = {
    getStats: async () => {
        const response = await axios.get(`${API_BASE_URL}/dashboard`);
        return response.data;
    }
};

export const uploadsApi = {
    uploadFile: async (file, templateType = "template1") => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('template_type', templateType);
        const response = await axios.post(`${API_BASE_URL}/uploads`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    
    getUploads: async () => {
        const response = await axios.get(`${API_BASE_URL}/uploads`);
        return response.data;
    },
    
    getUploadDetails: async (id) => {
        const response = await axios.get(`${API_BASE_URL}/uploads/${id}`);
        return response.data;
    },
    
    deleteUpload: async (id) => {
        const response = await axios.delete(`${API_BASE_URL}/uploads/${id}`);
        return response.data;
    },

    getExcelData: async (id) => {
        const response = await axios.get(`${API_BASE_URL}/uploads/${id}/data`);
        return response.data;
    },

    downloadReportUrl: (id) => `${API_BASE_URL}/uploads/${id}/report`,
    downloadExcelUrl: (id) => `${API_BASE_URL}/uploads/${id}/download`
};

export const billRecordsApi = {
    createRecord: async (payload) => {
        const response = await axios.post(`${API_BASE_URL}/bill-records/`, payload);
        return response.data;
    },
    updateRecord: async (id, payload) => {
        const response = await axios.put(`${API_BASE_URL}/bill-records/${id}`, payload);
        return response.data;
    },
    deleteRecord: async (id) => {
        const response = await axios.delete(`${API_BASE_URL}/bill-records/${id}`);
        return response.data;
    },
    markRecordsPrinted: async (recordIds, status = true) => {
        const response = await axios.put(`${API_BASE_URL}/bill-records/mark_printed`, { record_ids: recordIds, status: status });
        return response.data;
    },
    getTransactions: async (params = {}) => {
        const response = await axios.get(`${API_BASE_URL}/bill-records/transactions`, { params });
        return response.data;
    }
};

export const bulkApi = {
    createPlaces: async (payload) => {
        const response = await axios.post(`${API_BASE_URL}/bulk/places`, payload);
        return response.data;
    },
    createUsers: async (payload) => {
        const response = await axios.post(`${API_BASE_URL}/bulk/users`, payload);
        return response.data;
    },
    createFlowers: async (payload) => {
        const response = await axios.post(`${API_BASE_URL}/bulk/flowers`, payload);
        return response.data;
    },
    deleteGlobalFlower: async (flowerName) => {
        const response = await axios.delete(`${API_BASE_URL}/bulk/flowers/${encodeURIComponent(flowerName)}`);
        return response.data;
    }
};

export const advancesApi = {
    getUserAdvances: async (userId) => {
        const response = await axios.get(`${API_BASE_URL}/advances/user/${userId}`);
        return response.data;
    },
    getPlaceAdvances: async (placeId) => {
        const response = await axios.get(`${API_BASE_URL}/advances/place/${placeId}`);
        return response.data;
    },
    getYearAdvances: async (yearId) => {
        const response = await axios.get(`${API_BASE_URL}/advances/year/${yearId}`);
        return response.data;
    },
    createAdvance: async (payload) => {
        const response = await axios.post(`${API_BASE_URL}/advances/`, payload);
        return response.data;
    },
    updateAdvance: async (id, payload) => {
        const response = await axios.put(`${API_BASE_URL}/advances/${id}`, payload);
        return response.data;
    },
    bulkUpdateAdvanceDate: async (payload) => {
        const response = await axios.put(`${API_BASE_URL}/advances/bulk_date`, payload);
        return response.data;
    },
    deleteAdvance: async (id) => {
        const response = await axios.delete(`${API_BASE_URL}/advances/${id}`);
        return response.data;
    }
};

export const exportsApi = {
    generateExport: async (payload) => {
        const response = await axios.post(`${API_BASE_URL}/exports/generate`, payload);
        return response.data;
    },
    getHistory: async () => {
        const response = await axios.get(`${API_BASE_URL}/exports/history`);
        return response.data;
    },
    getDownloadUrl: (id) => {
        return `${API_BASE_URL}/exports/download/${id}`;
    }
};

export const creditSalesApi = {
    getAllData: async () => {
        const response = await axios.get(`${API_BASE_URL}/credit-sales`);
        return response.data;
    },
    createEntry: async (payload) => {
        const response = await axios.post(`${API_BASE_URL}/credit-sales`, payload);
        return response.data;
    },
    updateEntry: async (id, payload) => {
        const response = await axios.put(`${API_BASE_URL}/credit-sales/${id}`, payload);
        return response.data;
    },
    deleteEntry: async (id) => {
        const response = await axios.delete(`${API_BASE_URL}/credit-sales/${id}`);
        return response.data;
    },
    bulkUpdateEntries: async (payload) => {
        const response = await axios.put(`${API_BASE_URL}/credit-sales/bulk/update`, payload);
        return response.data;
    },
    bulkDeleteEntries: async (payload) => {
        const response = await axios.post(`${API_BASE_URL}/credit-sales/bulk/delete`, payload);
        return response.data;
    }
};
