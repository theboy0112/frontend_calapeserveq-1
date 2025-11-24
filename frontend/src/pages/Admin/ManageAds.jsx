import React, { useState } from "react";
import { useMutation, useQuery, gql } from "@apollo/client";
import Swal from "sweetalert2";
import "./styles/ManageAds.css";


const GET_ADS = gql`
  query GetAds {
    ads {
      id
      filename
      mimetype
      createdAt
    }
  }
`;

const UPLOAD_AD = gql`
  mutation UploadAd($file: Upload!) {
    uploadAd(file: $file)
  }
`;

const ManageAds = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const { data, refetch } = useQuery(GET_ADS);
  const [uploadAd] = useMutation(UPLOAD_AD);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
  };

  const handleUpload = async () => {
  if (!selectedFile) {
    Swal.fire("No file selected", "", "warning");
    return;
  }

  try {
    const formData = new FormData();

    const operations = {
      query: `
        mutation UploadAd($file: Upload!) {
          uploadAd(file: $file)
        }
      `,
      variables: { file: null },
    };

    const map = { '0': ['variables.file'] };

    formData.append('operations', JSON.stringify(operations));
    formData.append('map', JSON.stringify(map));
    formData.append('0', selectedFile);

    const token = localStorage.getItem("token"); // optional auth
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(import.meta.env.VITE_GRAPHQL_URI || "http://localhost:3000/graphql", {
      method: "POST",
      body: formData,
      headers,
      credentials: "include",
    });

    const result = await response.json();

    if (result.errors) throw new Error(result.errors[0].message);

    Swal.fire("Uploaded!", "Advertisement uploaded successfully!", "success");
    setSelectedFile(null);
    document.getElementById("file-input").value = "";
    refetch();
  } catch (err) {
    console.error(err);
    Swal.fire("Upload failed", err.message, "error");
  }
};

  return (
    <div className="upload-container">
  <input
    type="file"
    id="file-input"
    onChange={handleFileSelect}
    accept="image/*,video/*"
  />
  <button onClick={handleUpload}>Upload</button>
  <div className="uploaded-files">
    {data?.ads?.map((ad) => (
      <div key={ad.id}>
        <p>{ad.filename}</p>
      </div>
    ))}
  </div>
</div>
  );
};

export default ManageAds;
