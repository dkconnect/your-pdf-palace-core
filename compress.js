const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("fileInput");
const targetSizeInput = document.getElementById("targetSize");
const statusText = document.getElementById("status");
const downloadBtn = document.getElementById("downloadBtn");

let uploadedFile = null;
let compressedBlob = null;

dropArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropArea.classList.add("dragover");
});

dropArea.addEventListener("dragleave", () => {
    dropArea.classList.remove("dragover");
});

dropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    dropArea.classList.remove("dragover");
    handleFile(e.dataTransfer.files[0]);
});

fileInput.addEventListener("change", () => {
    handleFile(fileInput.files[0]);
});

function handleFile(file) {
    if (!file || file.type !== "application/pdf") {
        alert("Please upload a valid PDF file.");
        return;
    }

    uploadedFile = file;
    statusText.innerText = "PDF uploaded successfully.";
    checkStartCompression();
}

targetSizeInput.addEventListener("input", checkStartCompression);

function checkStartCompression() {
    if (uploadedFile && targetSizeInput.value) {
        compressPDF(uploadedFile, parseFloat(targetSizeInput.value));
    }
}

async function compressPDF(file, targetSizeMB) {

    statusText.innerText = "Processing compression...";
    downloadBtn.style.display = "none";

    const targetBytes = targetSizeMB * 1024 * 1024;
    const arrayBuffer = await file.arrayBuffer();

    const { PDFDocument } = PDFLib;

    let pdfDoc = await PDFDocument.load(arrayBuffer);

    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);

    let quality = 0.9;
    let compressedBytes;

    while (quality > 0.1) {

        const newPdf = await PDFDocument.create();
        const pages = await newPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());

        pages.forEach((page) => newPdf.addPage(page));

        compressedBytes = await newPdf.save({
            useObjectStreams: true,
        });

        if (compressedBytes.length <= targetBytes) break;

        quality -= 0.1;

        statusText.innerText =
            `Optimizing images... Quality: ${(quality * 100).toFixed(0)}%`;
    }

    compressedBlob = new Blob([compressedBytes], {
        type: "application/pdf",
    });

    statusText.innerText = "Compression complete!";
    downloadBtn.style.display = "inline-block";
}


downloadBtn.addEventListener("click", () => {

    if (!compressedBlob) return;

    const today = new Date().toISOString().split("T")[0];
    const originalName = uploadedFile.name.replace(".pdf", "");
    const newFileName = `${originalName}_${today}_compressed.pdf`;

    const url = URL.createObjectURL(compressedBlob);
    const a = document.createElement("a");

    a.href = url;
    a.download = newFileName;
    a.click();

    URL.revokeObjectURL(url);
});
