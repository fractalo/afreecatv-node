import axios from "axios";

export const logAxiosError = (error: unknown) => {
    if (!axios.isAxiosError(error)) return;

    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
    } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log('The request was made but no response was received');
    } else {
        // Something happened in setting up the request that triggered an Error
    }
}