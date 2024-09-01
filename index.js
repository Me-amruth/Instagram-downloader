const axios = require("axios");
const cheerio = require("cheerio");
const express = require("express");
const path = require("path");
const fs = require("fs");
const PORT = process.env.PORT || 3000;

const app = express();
const __path = process.cwd();

let filepath = "images/output.jpg";
let randStr = Math.floor(Math.random() * 100);

// Check if file exists and modify the filename if necessary
if (fs.existsSync(filepath)) {
    filepath = filepath.split(".")[0] + randStr + ".jpg";
}

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "images")));

app.get("/images/:filename", (req, res) => {
    const filePath = path.join(__dirname, "images", req.params.filename);
    console.log("Request for file:", filePath);
    res.sendFile(filePath, err => {
        if (err) {
            console.error("File not found");
            res.status(404).send("File not found");
        }
    });
});

app.get("/api", async (req, res) => {
    try {
        let url = req.query.url;
        if (!url) {
            return res.status(404).json({ error: "No URL found" });
        }

        url = formatUrl(url);
        const { data } = await axios.get(`${url}/embed/`);
        const $ = cheerio.load(data);

        const profileInfo = await getProfileInfo($, req);
        const contentInfo = await getContentInfo($, req);

        res.json({ ...contentInfo, ...profileInfo });
    } catch (error) {
        res.status(500).json({ error: "An error occurred while fetching data." });
    }
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__path, "public", "index.html"));
});

app.listen(PORT, () => {
    console.log("App started on localhost:" + PORT);
});

async function getContentInfo($, req) {
    let type = null;
    let source_url = "not_found";

    if ($.html().includes("video_url")) {
        const videoData = await extractVideoUrl($);
        type = "reel";
        source_url = videoData.video_url.replace(/\\\//g, "/");
    } else if ($(".EmbeddedMediaImage").length) {
        type = "image";
        source_url = await extractImageUrl($, req);
    } else {
        type = "Not found";
        source_url = "No media found";
    }

    return { type, source_url };
}

async function extractVideoUrl($) {
    try {
        const lastScriptTag = $("script").last().html();
        const start = lastScriptTag.indexOf("video_url");
        const sliceUrl = lastScriptTag.slice(start, start + 1000);
        const videoUrl = `{"${sliceUrl.split('",')[0]}"}`;
        const videoData = JSON.parse(videoUrl.replace(/\\"/g, '"'));
        return videoData;
    } catch (error) {
        console.error("Error fetching the video URL:", error);
        return {};
    }
}


async function extractImageUrl($, req) {
    try {
        let imageUrl = $(".EmbeddedMediaImage").attr("src") || "not_found";
        const localFilePath = `images/post_${Date.now()}.jpg`;
        await saveImage(imageUrl, localFilePath);
        return `http://${req.headers.host}/images/${path.basename(localFilePath)}`;
    } catch (error) {
        console.error("Error extracting image URL:", error);
        return "not_found";
    }
}

async function getProfileInfo($, req) {
    try {
        const pp_img = $(".AvatarContainer img").attr("src") || "Not found";
        const localFilePath = `images/profile_${Date.now()}.jpg`;
        await saveImage(pp_img, localFilePath);
        const username = $(".Username").text() || "Not found";

        const fileUrl = `http://${req.headers.host}/images/${path.basename(localFilePath)}`;

        return {
            username,
            profilePicture: fileUrl
        };
    } catch (error) {
        console.error("Error getting username or profile image:", error);
        return {
            username: "Not found",
            profilePicture: "Not found"
        };
    }
}

function formatUrl(url) {
    if (url.endsWith("/")) {
        return url.slice(0, -1);
    }
    if (url.includes("?igsh")) {
        return url.split("/?igsh")[0];
    }
    return url;
}

async function saveImage(url, filePath) {
    try {
        const response = await axios({ url, responseType: "stream" });

        response.data.pipe(fs.createWriteStream(filePath))
            .on("finish", () => {
                console.log("File saved");
                setTimeout(() => {
                    if (fs.existsSync(filePath)) {
                        fs.unlink(filePath, err => {
                            if (err) throw err;
                            console.log("File removed");
                        });
                    }
                }, 50000);
            })
            .on("error", err => {
                console.error("Error writing the file:", err.message);
            });
    } catch (error) {
        console.error("Error downloading the image:", error.message);
    }
  }
        
