import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";


// Set the worker file path
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;




const PDFViewer = ({ pdfUrl }) => {
    const [numPages, setNumPages] = useState(null);

    return (
        <div className="h-[82%] mxgdf-6 overflow-y-scroll w-[90%]  flex justify-center m-auto">
            <Document file={pdfUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
                {numPages &&
                    Array.from({ length: numPages }, (_, i) => (<>
                        <Page key={i}  pageNumber={i + 1} renderTextLayer={false} scale={2} renderAnnotationLayer={false} />
                        <div className="flex justify-end mb-[1rem] text-gray-50 z-10 ">{i+1}</div>
                    </>
                    ))}

            </Document>
        </div>
    );
};

export default PDFViewer;
