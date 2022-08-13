
module.exports = {

    // Browser sizes.
    screenWidth: 1366,
    screenHeight: 768,

    // Image quality only applies for jpg.
    imageQuality: 80,

    // Allowed values.
    allowedExtensions: ["pdf", "png", "jpg"],
    allowedOrientation: ["landscape", "portrait"],
    allowedFormats: ["Letter", "Legal", "Tabloid", "Ledger", "A0", "A1", "A2", "A3", "A4", "A5", "A6"],

    // Default values.
    defaultScreenShotExtension: "png",
    defaultLandscape: false,
    defaultPaperSize: "A4",
    defaultLoadDelay: 200,
    defaultBackground: true,
    defaultMargin: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
    },

    // Leave browserPath empty to use the default location. Recommended for development.
    browserPath: "",

    // Store temp files to this folder (no / at the end).
    folder: process.env.TEMP_PATH + "/html2m",

    // delete files older than 7 days
    filesDeletionAge: 7

};