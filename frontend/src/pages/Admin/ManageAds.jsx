import React, { useState } from "react";
import { useMutation, useQuery, gql } from "@apollo/client";
import Swal from "sweetalert2";
import { FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import "./styles/ManageAds.css";

const GET_ADS = gql`
  query GetAds {
    ads {
      id
      filename
      filepath
      mimetype
      createdAt
    }
  }
`;

const GET_AD = gql`
  query GetAd($id: Int!) {
    ad(id: $id) {
      id
      filename
      filepath
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

const UPDATE_AD = gql`
  mutation UpdateAd($id: Int!, $file: Upload!) {
    updateAd(id: $id, file: $file)
  }
`;

const DELETE_AD = gql`
  mutation DeleteAd($id: Int!) {
    deleteAd(id: $id)
  }
`;

const AdItem = ({
  ad,
  getImageUrl,
  selectedAds,
  toggleAdSelection,
  handleDelete,
}) => {
  const [resolution, setResolution] = useState(null);

  return (
    <div className="ad-card">
      <div className="ad-preview">
        {ad.mimetype?.startsWith("image/") && (
          <img
            src={getImageUrl(ad.filepath)}
            alt={ad.filename}
            onLoad={(e) =>
              setResolution(
                `${e.target.naturalWidth} x ${e.target.naturalHeight}`,
              )
            }
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
        )}

        {ad.mimetype?.startsWith("video/") && (
          <video
            src={getImageUrl(ad.filepath)}
            controls
            onLoadedMetadata={(e) =>
              setResolution(`${e.target.videoWidth} x ${e.target.videoHeight}`)
            }
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
        )}

        <div className="file-placeholder" style={{ display: "none" }}>
          <span>{ad.mimetype?.startsWith("video/") ? "🎥" : "📄"}</span>
          <span>Preview failed to load</span>
        </div>
      </div>

      <div className="ad-info">
        <p className="ad-filename">{ad.filename}</p>
        <p className="ad-meta">
          {ad.mimetype} • {new Date(ad.createdAt).toLocaleDateString()}
        </p>
        {resolution && (
          <p
            className="ad-resolution"
            style={{
              fontSize: "0.85rem",
              color: "#555",
              marginTop: "5px",
              fontWeight: "500",
            }}
          >
            Dimensions: {resolution} px
          </p>
        )}
      </div>

      <div className="ad-actions">
        <label className="tv-checkbox">
          Show on TV
          <input
            type="checkbox"
            checked={selectedAds.includes(String(ad.id))}
            onChange={() => toggleAdSelection(ad.id)}
          />
        </label>
        <button
          onClick={() => handleDelete(ad.id, ad.filename)}
          className="btn-delete"
          title="Delete"
          style={{
            color: "red",
            border: "none",
            background: "none",
            cursor: "pointer",
            fontSize: "1.2rem",
          }}
        >
          <FaTrash />
        </button>
      </div>
    </div>
  );
};

const ManageAds = () => {
  const [selectedAds, setSelectedAds] = useState(() => {
    const saved = localStorage.getItem("tv_selected_ad_ids");
    return saved ? JSON.parse(saved) : [];
  });
  const [showAdsGlobally, setShowAdsGlobally] = useState(() => {
    const saved = localStorage.getItem("tv_show_ads_global");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [editingAd, setEditingAd] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const { data, loading, refetch } = useQuery(GET_ADS);
  const [uploadAd] = useMutation(UPLOAD_AD);
  const [updateAd] = useMutation(UPDATE_AD);
  const [deleteAd] = useMutation(DELETE_AD);

  const BASE_URL = import.meta.env.VITE_GRAPHQL_URI
    ? import.meta.env.VITE_GRAPHQL_URI.replace("/graphql", "")
    : "http://localhost:3000";

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
  };

  const toggleAdSelection = (adId) => {
    const id = String(adId);
    setSelectedAds((prev) =>
      prev.includes(id)
        ? prev.filter((prevId) => prevId !== id)
        : [...prev, id],
    );
  };

  // Persist to localStorage whenever state changes
  React.useEffect(() => {
    localStorage.setItem("tv_selected_ad_ids", JSON.stringify(selectedAds));
  }, [selectedAds]);

  React.useEffect(() => {
    localStorage.setItem("tv_show_ads_global", JSON.stringify(showAdsGlobally));
  }, [showAdsGlobally]);

  const validateMedia = (file) => {
    return new Promise((resolve, reject) => {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");

      if (!isVideo && !isImage) {
        reject("Unsupported file type");
        return;
      }

      const objectUrl = URL.createObjectURL(file);

      if (isImage) {
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);

          resolve(true);
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject("Failed to load image");
        };
        img.src = objectUrl;
      } else if (isVideo) {
        const video = document.createElement("video");
        video.onloadedmetadata = () => {
          URL.revokeObjectURL(objectUrl);
          const ratio = video.videoWidth / video.videoHeight;
          if (ratio < 1.7 || ratio > 1.8) {
            reject(
              `Invalid aspect ratio (${ratio.toFixed(2)}). Please upload a landscape video (16:9 ratio, e.g., 1920x1080).`,
            );
          } else {
            resolve(true);
          }
        };
        video.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject("Failed to load video metadata");
        };
        video.src = objectUrl;
      }
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Swal.fire("No file selected", "", "warning");
      return;
    }

    try {
      await validateMedia(selectedFile);
    } catch (error) {
      Swal.fire(
        "Validation Failed",
        typeof error === "string" ? error : "Invalid file",
        "error",
      );
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      const operations = {
        query: `mutation UploadAd($file: Upload!) { uploadAd(file: $file) }`,
        variables: { file: null },
      };

      const map = { 0: ["variables.file"] };

      formData.append("operations", JSON.stringify(operations));
      formData.append("map", JSON.stringify(map));
      formData.append("0", selectedFile, selectedFile.name);

      const token = localStorage.getItem("token");
      const graphqlUri =
        import.meta.env.VITE_GRAPHQL_URI || "http://localhost:3000/graphql";

      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(graphqlUri, {
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
      Swal.fire("Upload failed", err.message, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdate = async (adId) => {
    if (!selectedFile) {
      Swal.fire("No file selected", "", "warning");
      return;
    }

    try {
      await validateMedia(selectedFile);
    } catch (error) {
      Swal.fire(
        "Validation Failed",
        typeof error === "string" ? error : "Invalid file",
        "error",
      );
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      const operations = {
        query: `mutation UpdateAd($id: Int!, $file: Upload!) { updateAd(id: $id, file: $file) }`,
        variables: { id: adId, file: null },
      };

      const map = { 0: ["variables.file"] };

      formData.append("operations", JSON.stringify(operations));
      formData.append("map", JSON.stringify(map));
      formData.append("0", selectedFile, selectedFile.name);

      const token = localStorage.getItem("token");
      const graphqlUri =
        import.meta.env.VITE_GRAPHQL_URI || "http://localhost:3000/graphql";

      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(graphqlUri, {
        method: "POST",
        body: formData,
        headers,
        credentials: "include",
      });

      const result = await response.json();
      if (result.errors) throw new Error(result.errors[0].message);

      Swal.fire("Updated!", "Advertisement updated successfully!", "success");
      setSelectedFile(null);
      setEditingAd(null);
      document.getElementById("file-input").value = "";
      refetch();
    } catch (err) {
      Swal.fire("Update failed", err.message, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (adId, filename) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Delete "${filename}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const { data } = await deleteAd({ variables: { id: adId } });
        if (data.deleteAd) {
          Swal.fire("Deleted!", "Advertisement deleted!", "success");
          refetch();
        }
      } catch (err) {
        Swal.fire("Delete failed", err.message, "error");
      }
    }
  };

  const handleEdit = (ad) => {
    setEditingAd(ad);
    setSelectedFile(null);
    document.getElementById("file-input").value = "";
  };

  const handleCancelEdit = () => {
    setEditingAd(null);
    setSelectedFile(null);
    document.getElementById("file-input").value = "";
  };

  const getImageUrl = (filepath) => {
    if (!filepath) return "";
    if (filepath.startsWith("http://") || filepath.startsWith("https://")) {
      return filepath;
    }
    return `${BASE_URL}${filepath.startsWith("/") ? "" : "/"}${filepath}`;
  };

  if (loading) return <p>Loading ads...</p>;

  return (
    <div className="upload-container">
      <div className="upload-section">
        <h2>
          {editingAd ? "Update Advertisement" : "Upload New Advertisement"}
        </h2>
        <input
          type="file"
          id="file-input"
          onChange={handleFileSelect}
          accept="image/*,video/*"
          disabled={isUploading}
        />
        <div className="upload-actions">
          {editingAd ? (
            <>
              <button
                onClick={() => handleUpdate(editingAd.id)}
                disabled={isUploading || !selectedFile}
                className="btn-update"
              >
                {isUploading ? "Updating..." : "Update"}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={isUploading}
                className="btn-cancel"
              >
                <FaTimes /> Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleUpload}
              disabled={isUploading || !selectedFile}
              className="btn-upload"
            >
              {isUploading ? "Uploading..." : "Upload"}
            </button>
          )}
        </div>
      </div>

      <div className="uploaded-files">
        <h3>Uploaded Advertisements</h3>
        {loading ? (
          <p>Loading...</p>
        ) : data?.ads?.length === 0 ? (
          <p className="no-ads">No advertisements uploaded yet.</p>
        ) : (
          <>
            <div
              className="global-ads-toggle"
              style={{
                marginBottom: "20px",
                padding: "10px",
                background: "#f8f9fa",
                borderRadius: "8px",
                border: "1px solid #dee2e6",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                }}
              >
                <input
                  type="checkbox"
                  checked={showAdsGlobally}
                  onChange={(e) => setShowAdsGlobally(e.target.checked)}
                  style={{ width: "20px", height: "20px" }}
                />
                Enable Ads on TV Monitor (Master Switch)
              </label>
              <p
                style={{
                  margin: "5px 0 0 30px",
                  fontSize: "0.9rem",
                  color: "#6c757d",
                }}
              >
                Uncheck this to hide ALL ads on the TV Monitor immediately.
              </p>
            </div>
            <div className="ads-grid">
              {data?.ads?.map((ad) => (
                <AdItem
                  key={ad.id}
                  ad={ad}
                  getImageUrl={getImageUrl}
                  selectedAds={selectedAds}
                  toggleAdSelection={toggleAdSelection}
                  handleDelete={handleDelete}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ManageAds;
