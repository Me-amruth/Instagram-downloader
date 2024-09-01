function cleanUrl(url) {
    // Create a URL object
    let urlObj = new URL(url);
    // Rebuild the URL without the query string
    let cleanUrl = `${urlObj.origin}${urlObj.pathname}`;
    return cleanUrl;
}

// ---------------------------------
// ---------- Popup codes ----------
// ---------------------------------

document.addEventListener("DOMContentLoaded", function () {
    const popup = document.getElementById("popup");
    const closeBtn = document.querySelector(".close-btn");
    const closePopupBtn = document.getElementById("closePopupBtn");

    let link = document.getElementById("link");
    let submitBtn = document.getElementById("submitBtn");
    let info = document.querySelector(".info");
    let icon = document.getElementById("icon");
    let username = document.getElementById("username");
    let loading = document.querySelector(".circle");
    let media = document.querySelector(".media-container");
    let videoPlayer = document.createElement("video");

    submitBtn.addEventListener("click", () => {
        if (link.value && link.value.includes("instagram")) {
            submitBtn.disabled = true;
            loading.style.display = "block";
            fetch(`/api?url=${encodeURIComponent(cleanUrl(link.value))}`)
                .then(res => res.json())
                .then(data => {
                    media.innerHTML = "";
                    icon.src = data.profilePicture;
                    username.innerHTML = data.username;

                    submitBtn.disabled = false;
                    if (data.type == "reel") {
                        videoPlayer.src = data.source_url;
                        videoPlayer.id = "videoPlayer";
                        videoPlayer.controls = true;
                        media.appendChild(videoPlayer);
                        videoPlayer.load();
                        videoPlayer.style.display = "block";
                        videoPlayer.play();
                    } else {
                        let download = document.createElement('a');
                        download.href = data.source_url;
                        download.download = 'Post_' + Date.now() +'.jpg';
                        download.innerHTML = "Click here";
                        media.appendChild(download);
                    }
                    loading.style.display = "none";
                    popup.style.display = "flex";
                })
                .catch(err => {
                    alert("Error: " + err);
                    this.disabled = false;
                    loading.style.display = "none";
                });
        } else {
            alert("Need instagram video url");
        }
    });

    closeBtn.addEventListener("click", function () {
        videoPlayer.pause();
        popup.style.display = "none";
    });

    closePopupBtn.addEventListener("click", function () {
        videoPlayer.pause();
        popup.style.display = "none";
    });

    // Close the popup if the user clicks outside of the popup content
    /*
window.addEventListener('click', function(event) {
        if (event.target == popup) {
            popup.style.display = 'none';
        }
    });
   
    */

    // ----------------------------
    // ---- End of popup code -----
    // ----------------------------
});
