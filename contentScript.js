(() => {
    let ytLeftControls, ytPlayer;
    let currentVid = "";
    let currentVidBookmarks = [];
  
    const retrieveBookmarks = () => {
      return new Promise((resolve) => {
        chrome.storage.sync.get([currentVid], (obj) => {
          resolve(obj[currentVid] ? JSON.parse(obj[currentVid]) : []);
        });
      });
    };
  
    const addBookmarkHandler = async () => {
      const currentTime = ytPlayer.currentTime;
      const newBookmark = {
        time: currentTime,
        desc: "Bookmark at " + getFormattedTime(currentTime),
      };
  
      currentVidBookmarks = await retrieveBookmarks();
  
      chrome.storage.sync.set({
        [currentVid]: JSON.stringify([...currentVidBookmarks, newBookmark].sort((a, b) => a.time - b.time))
      });
    };
  
    const newVideoLoadedHandler = async () => {
      const bookmarkBtnExists = document.getElementsByClassName("bookmark-btn")[0];
  
      currentVidBookmarks = await retrieveBookmarks();
  
      if (!bookmarkBtnExists) {
        const bookmarkBtn = document.createElement("img");
  
        bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
        bookmarkBtn.className = "ytp-button " + "bookmark-btn";
        bookmarkBtn.title = "Click to bookmark current timestamp";
  
        ytLeftControls = document.getElementsByClassName("ytp-left-controls")[0];
        ytPlayer = document.getElementsByClassName('video-stream')[0];
  
        ytLeftControls.appendChild(bookmarkBtn);
        bookmarkBtn.addEventListener("click", addBookmarkHandler);
      }
    };
  
    chrome.runtime.onMessage.addListener((obj, sender, response) => {
      const { type, value, videoId } = obj;
  
      if (type === "NEW") {
        currentVid = videoId;
        newVideoLoadedHandler();
      } else if (type === "PLAY") {
        ytPlayer.currentTime = value;
      } else if ( type === "DELETE") {
        currentVidBookmarks = currentVidBookmarks.filter((b) => b.time != value);
        chrome.storage.sync.set({ [currentVid]: JSON.stringify(currentVidBookmarks) });
  
        response(currentVidBookmarks);
      }
    });
  
    newVideoLoadedHandler();
  })();
  
  const getFormattedTime = t => {
    var date = new Date(0);
    date.setSeconds(t);
  
    return date.toISOString().substr(11, 8);
  };
  
  chrome.tabs.onUpdated.addListener((tabId, tab) => {
    if (tab.url && tab.url.includes("youtube.com/watch")) {
      const queryParameters = tab.url.split("?")[1];
      const urlParameters = new URLSearchParams(queryParameters);
  
      chrome.tabs.sendMessage(tabId, {
        type: "NEW",
        videoId: urlParameters.get("v"),
      });
    }
  });
  