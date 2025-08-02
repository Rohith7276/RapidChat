import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useStreamStore } from '../../../store/useStreamStore';

import { useChatStore } from "../../../store/useChatStore";
import { axiosInstance } from "../../../lib/axios";
import { useAuthStore } from "../../../store/useAuthStore";
import { Download, Sun } from "lucide-react";
import { jsPDF } from "jspdf"

// Set the worker file path
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;




const PDFViewer = ({ pdfUrl }) => {
    const [numPages, setNumPages] = useState(null);
    // Removed unused scroll state
    const [brightness, setBrightness] = useState(100)
    const [notes, setNotes] = useState("")
    const [color, setColor] = useState("#111")
    const [bg, setBg] = useState("#f4edd2")
    const pdfRef = useRef(null)
    const { selectedUser } = useChatStore()
    const { setPdfScroll, pdfCheck, pdfScrollTop, setStreamData, setStartStreaming, endStream, streamData } = useStreamStore()
    const { authUser } = useAuthStore()

    useEffect(() => {
        if (pdfRef.current) {
            setPdfScroll(pdfRef.current.scrollTop);
            console.log(`Scroll Top: ${pdfRef.current.scrollTop}`);
        }
    }, [pdfCheck]);

    useEffect(() => {
        setBrightness(localStorage.getItem("brightness") || 50)
        setBg(localStorage.getItem("bg") || "#f4edd2")
        setColor(localStorage.getItem("color") || "#111")
        
        document.documentElement.style.setProperty(
            "--note-text-size",
            `${localStorage.getItem("size") || 16}px`
        )

    }, [])



    useEffect(() => {
        console.log("pdfScrollTop", pdfScrollTop)
        pdfRef.current.scrollTop = pdfScrollTop

    }, [pdfScrollTop]);
    useEffect(() => {
        console.log(brightness)
    }, [brightness])



    return (
        <><div className="flex flex-col items-center justify-center w-full h-full px-4 rounded-lg">
            <div
                ref={pdfRef}
                className="h-[500px] mx-auto overflow-y-scroll w-[900px] flex flex-col items-center"
            >
                <div className="w-full p-2" style={{ filter: `brightness(${brightness}%)` }}>
                    <Document
                        file={pdfUrl}
                        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                        className="w-full"
                    >
                        {numPages &&
                            Array.from({ length: numPages }, (_, i) => (
                                <div key={i} className="w-full mb-4">
                                    <Page
                                        pageNumber={i + 1}
                                        renderTextLayer={false}
                                        scale={1.5}
                                        renderAnnotationLayer={false}
                                        className="border border-gray-700 rounded-lg" />
                                    <div className="flex justify-end mt-2 text-gray-400 text-sm">
                                        Page {i + 1} of {numPages}
                                    </div>
                                </div>
                            ))}
                    </Document>
                </div>
            </div>
            <div className="flex justify-between w-full px-11 items-center mt-4">
                {streamData.senderInfo.fullName !== authUser?.fullName && (
                    <button
                        className="bg-base-content text-base-300 p-2 px-3 rounded-md"
                        onClick={async () => {
                            await axiosInstance.get(
                                `/auth/user/stream-control/${selectedUser._id}/999999/${streamData._id}`
                            );
                        }}
                    >
                        Seek
                    </button>
                )}
                {streamData.senderInfo.fullName === authUser?.fullName && (
                    <button
                        className="bg-base-content text-base-300 p-2 px-3 rounded-md"
                        onClick={() => {
                            setStartStreaming(false);
                            setStreamData([]);
                            endStream();
                        }}
                    >
                        End Stream
                    </button>
                )}
                <button
                    onClick={() => {
                        fetch(pdfUrl)
                            .then((response) => response.blob())
                            .then((blob) => {
                                const link = document.createElement("a");
                                link.href = URL.createObjectURL(blob);
                                link.download = streamData?.streamInfo?.title + ".pdf";
                                link.click();
                                URL.revokeObjectURL(link.href);
                            })
                            .catch((error) => console.error("Error downloading the file:", error));
                    }}
                >
                    <Download />
                </button>
                <div className="flex items-center gap-2">
                    <Sun />
                    <input
                        type="range"
                        value={brightness}
                        min={20}
                        max={200}
                        onChange={(e) => {
                            setBrightness(e.target.value);
                            localStorage.setItem("brightness", e.target.value);
                        }} />
                </div>
                <div>
                    <label htmlFor="color" className="text-base-context"></label> 
                </div>
                <input
                    type="color"
                    value={bg}
                    onChange={(e) => {
                        setBg(e.target.value);
                        localStorage.setItem("bg", e.target.value);
                    }} />

                <label htmlFor="color" className="text-base-context"> 
                </label>
                <input
                    type="color"
                    value={color}
                    onChange={(e) => {
                        setColor(e.target.value);
                        localStorage.setItem("color", e.target.value);
                    }} />

                <label htmlFor="textSize" className="text-base-context">
                 
                </label>
                <input
                    type="number"
                    min={10}
                    max={50}
                    defaultValue={16}
                    className="bg-base-content  text-base-100"
                    onChange={(e) => {
                        document.documentElement.style.setProperty(
                            "--note-text-size",
                            `${e.target.value}px`
                        );
                        localStorage.setItem("size", e.target.value);
                    }} />
            </div>
        </div>
            <div className="mt-11  flex flex-col gap-6 justify-center items-center my-5">
                <textarea
                    id="notesArea"
                    name="notes"
                    style={{
                        backgroundColor: bg,
                        color: color,
                        fontSize: "var(--note-text-size, 16px)",
                        lineHeight: "1.2", // Decreased line height

                    }}
                    placeholder="Notes"
                    value={notes}
                    onChange={(e) => { setNotes(e.target.value);   }}
                    className="w-[57vw] rounded-md p-5 text-base-300  text-4xl max-h-full h-[20vh]"
                ></textarea>
                <button
                    className="bg-base-content userselect  text-base-300 mb-3 p-2 px-3 rounded-md"
                    onClick={() => {
                        const notesArea = document.getElementById("notesArea");
                        if (!notesArea || !notesArea.value.trim()) {
                            alert("Please add some notes before saving.");
                            return;
                        }

                        const pdf = new jsPDF();
                        const style = window.getComputedStyle(notesArea);

                        const lines = notesArea.value.split("\n");
                        const lineHeight = parseInt(style.fontSize) * 1;
                        const margin = 10;
                        let y = margin;
                        // pdf.setFontSize(parseInt(style.fontSize, 10));
                        const rgb = style.color.match(/\d+/g);
                        if (rgb) {
                            pdf.setTextColor(parseInt(rgb[0], 10), parseInt(rgb[1], 10), parseInt(rgb[2], 10));
                        }

                        const bgRgb = style.backgroundColor.match(/\d+/g);
                        if (bgRgb) {
                            pdf.setFillColor(parseInt(bgRgb[0], 10), parseInt(bgRgb[1], 10), parseInt(bgRgb[2], 10));
                            pdf.rect(0, 0, pdf.internal.pageSize.width, pdf.internal.pageSize.height, 'F');
                        }

                        lines.forEach((line) => {
                            const wrappedLines = pdf.splitTextToSize(line, pdf.internal.pageSize.width - 2 * margin);
                            wrappedLines.forEach((wrappedLine) => {
                                if (y + lineHeight > pdf.internal.pageSize.height - margin) {
                                    pdf.addPage();
                                    const rgb = style.color.match(/\d+/g);
                                    if (rgb) {
                                        pdf.setTextColor(parseInt(rgb[0], 10), parseInt(rgb[1], 10), parseInt(rgb[2], 10));
                                    }

                                    const bgRgb = style.backgroundColor.match(/\d+/g);
                                    if (bgRgb) {
                                        pdf.setFillColor(parseInt(bgRgb[0], 10), parseInt(bgRgb[1], 10), parseInt(bgRgb[2], 10));
                                        pdf.rect(0, 0, pdf.internal.pageSize.width, pdf.internal.pageSize.height, 'F');
                                    }
                                    y = margin;
                                }
                                pdf.text(wrappedLine, margin, y);
                                y += lineHeight;
                            });
                        });

                        pdf.save((streamData?.streamInfo?.title || "notes") + "_notes.pdf");
                    }
                    }
                >
                    Save Notes
                </button>
            </div>
        </>
    );
};

export default PDFViewer;
