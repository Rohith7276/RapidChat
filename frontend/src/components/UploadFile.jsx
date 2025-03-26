import { useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";

const UploadPDF = ({ onUpload }) => {
    const [file, setFile] = useState(null);

    const handleFileChange = (e) => setFile(e.target.files[0]);

    const uploadFile = async () => {
        if (!file) return alert("Please select a file!");

        const formData = new FormData();
        formData.append("pdf", file);

        try {
            const { data } = await axios.post("http://localhost:3000/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            console.log(data)
            
            onUpload(data.fileUrl);  // Pass the file path to the parent component
        } catch (err) {
            console.error(err);
            alert("File upload failed");
        }
    };

    return (
        <div className="flex flex-col items-center space-y-4">
            <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <button
                onClick={uploadFile}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Upload
            </button>
        </div>
    );
};
UploadPDF.propTypes = {
    onUpload: PropTypes.func.isRequired,
};
 
export default UploadPDF;
