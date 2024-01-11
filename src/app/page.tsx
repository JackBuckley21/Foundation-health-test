'use client'

import React, { useState } from 'react';
import Dropzone from 'react-dropzone';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [frameCount, setFrameCount] = useState(null);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);

  const handleDrop = async (acceptedFiles: any) => {
  
    setFile(acceptedFiles[0]);
    setError(null);

    try {
      if (file) {
        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);

        console.log(formData)

        const response = await fetch('http://localhost:8080/api/frames', { 
          method: 'POST',
          body: formData, // Use formData for file uploads
        });

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log(data)
        setFrameCount(data.frameCount);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Dropzone onDrop={handleDrop} accept={{ 'audio/*': ['.mp3'] }}>
        {({ getRootProps, getInputProps }: any) => (
          <section>
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <p>Drag n drop an MP3 file here, or click to select one</p>
            </div>
            {loading && <p>Uploading...</p>}
            {error && <p>Error: {error}</p>}
            {frameCount && <p>Frame count: {frameCount}</p>}
          </section>
        )}
      </Dropzone>
    </div>
  );
}