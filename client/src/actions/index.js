import axios from 'axios';
import History from '../history.js';
import * as type from './types';

const API_URL = process.env.REACT_APP_API_URL;
let TOKEN = localStorage.getItem('token');
let UID = localStorage.getItem('uid');

export const signUp = (...data) => {
    return async () => {
        await axios.post(`${API_URL}/users`, ...data)
            .then(() => {
                History.push('/signin');
            })
            .catch(error => {
                throw error.response.data.error.message;
            });
    };
};

export const setSession = (response) => {
    response.isAdmin = response.roles.find(x => x.name === 'admin') ? true : false;
    response.isEditor = response.roles.find(x => x.name === 'editor') ? true : false;
    sessionStorage.setItem('me', JSON.stringify(response))
    return response;
};

export const signIn = (...data) => {
    return async (dispatch) => {
        await axios.post(`${API_URL}/users/login`, ...data)
            .then(response => {
                localStorage.setItem('token', response.data.id);
                localStorage.setItem('uid', response.data.userId);
                localStorage.setItem('ttl', response.data.ttl);
                TOKEN = localStorage.getItem('token');
                UID = localStorage.getItem('uid');
                getUser(response.data.userId)
                    .then(response => {
                        dispatch({type: type.AUTH_USER, payload: setSession(response)});
                        History.push('/home');
                    })
                    .catch(error => {
                        throw error.response.data.error.message;
                    })
            })
            .catch(error => {
                throw error.response.data.error.message;
            });
    };
};

export const signOut = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('me');
    TOKEN = null;
    History.push('/');
    return {type: type.UNAUTH_USER, me: false};
};

export const getUser = (uid) => {
    return new Promise((resolve, reject) => {
        axios.get(`${API_URL}/users/${uid}`, {
            headers: {authorization: localStorage.getItem('token')}
        })
            .then(response => {
                resolve(response.data)
            })
            .catch(error => {
                reject(error.response.data.error)
            });
    });
};

export const getProfile = (username) => {
    return new Promise((resolve, reject) => {
        axios.get(`${API_URL}/users/profile/${username}`, {
            headers: {authorization: localStorage.getItem('token')}
        })
            .then(response => {
                resolve(response.data.user)
            })
            .catch(error => {
                reject(error.response.data.error)
            });
    });
};

export const getSession = (callback) => {
    const token = localStorage.getItem('token');
    const me = sessionStorage.getItem('me');
    if (token) {
        console.log(token);
        if (me) {
            callback(JSON.parse(me));
        } else {
            getUser(localStorage.getItem('uid'))
                .then((response) => {
                    callback(setSession(response))
                })
                .catch((error) => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('uid');
                    localStorage.removeItem('ttl');
                    window.location.reload(true);
                    throw error;
                });
        }
    } else callback(null)
};

export const settingsAccount = (...data) => {
    return async (dispatch) => {
        await axios.patch(`${API_URL}/users/${UID}`, ...data,
            {headers: {authorization: TOKEN}})
            .then(response => {
                dispatch({type: type.AUTH_USER, payload: setSession(response.data)});
            })
            .catch(error => {
                throw error.response.data.error.message;
            });
    };
};

export const settingsChangePassword = ({oldPassword, newPassword}) => {
    return async (dispatch) => {
        await axios.post(`${API_URL}/users/change-password`, {oldPassword, newPassword},
            {headers: {authorization: localStorage.getItem('token')}})
            .then(response => {
                return response.data;
            })
            .catch(error => {
                throw error.response.data.error.message;
            });
    };
};

export const getUsers = () => {
    return async (dispatch) => {
        await axios.get(`${API_URL}/users/`, {
            headers: {authorization: localStorage.getItem('token')}
        })
            .then(response => {
                dispatch({type: type.GET_USERS_SUCCESS, payload: response.data});
            })
            .catch(error => {
                console.log('ERROR --', error);
                dispatch({
                    type: type.GET_USERS_ERROR,
                    payload: error.response.data && error.response.data.error.message
                });
            });
    }
};

export const updateUser = async (data) => {
    await axios.patch(`${API_URL}/users/${data.id}`, data,
        {headers: {authorization: TOKEN}})
        .then(response => {
            return response.data
        })
        .catch(error => {
            throw error.response.data.error.message;
        });
};

export const toggleAdmin = (id) => {
    return new Promise((resolve, reject) => {
        axios.post(`${API_URL}/users/${id}/toggleAdmin`,
            {headers: {authorization: TOKEN}})
            .then(response => {
                resolve(response.data.data)
            })
            .catch(error => {
                reject(error.response.data.error.message);
            });
    });
};

export const toggleEditor = (id) => {
    return new Promise((resolve, reject) => {
        axios.post(`${API_URL}/users/${id}/toggleEditor`,
            {headers: {authorization: TOKEN}})
            .then(response => {
                resolve(response.data.data)
            })
            .catch(error => {
                reject(error.response.data.error.message);
            });
    });
};

export const uploadCoverImage = (file) => {
    return async (dispatch) => {
        await axios.post(`${API_URL}/users/${UID}/cover`, file, {
            headers: {authorization: TOKEN},
            onUploadProgress: progressEvent => {
                console.log(progressEvent.loaded, progressEvent.total)
            }
        })
            .then(response => {
                const me = JSON.parse(sessionStorage.getItem('me'));
                me.cover = response.data.file || me.cover;
                dispatch({type: type.AUTH_USER, payload: setSession(me)});
                //return me;
            })
            .catch(error => {
                console.log('uploadCoverImage ERROR', error);
                //throw error.response.data.error.message;
            })
    };
};

export const uploadProfileImage = (file) => {
    return async (dispatch) => {
        await axios.post(`${API_URL}/users/${UID}/image`, file, {
            headers: {authorization: TOKEN},
            onUploadProgress: progressEvent => {
                console.log(progressEvent.loaded, progressEvent.total)
            }
        })
            .then(response => {
                console.log('uploadProfileImage', response);
                const me = JSON.parse(sessionStorage.getItem('me'));
                me.image = response.data.file || me.image;
                console.log('uploadProfileImage', me);
                dispatch({type: type.AUTH_USER, payload: setSession(me)});
                //return me;
            })
            .catch(error => {
                console.log('uploadProfileImage ERROR', error);
                //throw error.response.data.error.message;
            })
    };
};



