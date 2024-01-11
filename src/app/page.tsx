'use client'

import React, { useState } from 'react';
import Dropzone from 'react-dropzone';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [frameCount, setFrameCount] = useState(null);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null); // Store the selected file

  

  const handleDrop = async (acceptedFiles: any) => {


    setFile(acceptedFiles[0]);
    setError(null);

    try {
      if (file) { // Ensure a file is selected before proceeding
        const formData = new FormData();
        formData.append('file', file); // Append the file object
  
        setLoading(true);

        const response = await fetch('/pages/api/frames.ts', {
          method: 'POST',
          body: file,
        });

        
        const data = await response.json();
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