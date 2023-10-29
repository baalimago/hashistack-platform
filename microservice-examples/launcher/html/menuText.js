function isSmartphone() {
    let check = false;
    (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
};

if (isSmartphone()) {
    document.getElementById("titleP").innerHTML += "<br><i style='font-size: smaller'>(if you're on a smartphone, hold for 1 second to goto link)</i>"
}

window.addEventListener("addMouseStuffToLinkClassDoms", () => {
    const links = document.getElementsByClassName("link");

    for (let i = 0; i < links.length; i++) {
        const l = links[i];
        l.addEventListener("mouseenter", handleLinkMouseenter)
        l.addEventListener("mouseleave", handleLinkMouseleave)
        l.addEventListener("touchstart", handleLinkTapStart)
        l.addEventListener("touchend", handleLinkTapEnd)
        l.addEventListener("mouseup", (e) => {
            var isRightMB;
            e = e || window.event;

            if ("which" in e)  // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
                isRightMB = e.which == 3;
            else if ("button" in e)  // IE, Opera 
                isRightMB = e.button == 2;

            console.log(e);

            if (!isSmartphone() && !isRightMB) {
                location.href = `https://${e.target.getAttribute("data-subdomain")}.lorentz.app`
            }
        })
    }
})

dispatchEvent(new CustomEvent("addMouseStuffToLinkClassDoms"))

function postAnimCheck() {
    setTimeout(() => {
        window.dispatchEvent(new CustomEvent('updateIntersectionBuffer'));
        checkIfButtonsAreInTheWayOfTitleAndIfItDoesThenDoSomethingAboutIt()
    }, 600);
}

function handleLinkMouseenter(ev) {
    postAnimCheck();
    const p = ev.target.getElementsByTagName("p")[0];
    p.style.height = `${p.scrollHeight}px`;
    p.style.opacity = "1";
}

function handleLinkMouseleave(ev) {
    postAnimCheck();
    const p = ev.target.getElementsByTagName("p")[0];
    p.style.height = "0px";
    p.style.opacity = "0";
}

function checkIfButtonsAreInTheWayOfTitleAndIfItDoesThenDoSomethingAboutIt() {
    const titleDomRect = document.getElementById("title");
    const linksContainerDoms = document.getElementsByClassName("links-container");
    let linksContainerDom;
    for (let i = 0; i < linksContainerDoms.length; i++) {
        const lcd = linksContainerDoms[i];
        if (lcd.style.display !== "none") {
            linksContainerDom = lcd;
            break;
        }
    }
    if (titleDomRect.getBoundingClientRect().bottom + 20 > linksContainerDom.getBoundingClientRect().top) {
        let newY = (linksContainerDom.getBoundingClientRect().top - 120);
        if (newY < 0) newY = 0;
        titleDomRect.style.top = newY + "px";
    }
}

let tapDurationTrack = -1;

function handleLinkTapStart(ev) {
    tapDurationTrack = performance.now();
    const isOpen = ev.target.getAttribute("data-isopen");
    window.dispatchEvent(new CustomEvent('resetIntersectionBuffer'));
    postAnimCheck();
    // ... yeah, gotta love js
    if (!isOpen || isOpen === "false") {
        ev.target.setAttribute("data-isopen", true);
        const p = ev.target.getElementsByTagName("p")[0];
        p.style.color = "white";
        handleLinkMouseenter(ev);
    } else {
        ev.target.setAttribute("data-isopen", false);
        ev.target.style.background = "unset";
        handleLinkMouseleave(ev);
    }
}

function handleLinkTapEnd(ev) {
    let diff = performance.now() - tapDurationTrack;
    if (diff > 1000) {
        location.href = `https://${ev.target.getAttribute("data-subdomain")}.lorentz.app`
    }
}

const lastVisit = localStorage.getItem("lastVisit")
let skipIntro = window.DEV;
// If visited sometime the last week, skip the slow intro animation
const now = Date.now()
if (lastVisit !== "" && (now - parseInt(lastVisit, 10)) < (1000 * 3600 * 24 * 7)) {
    console.debug("has visited recently");
    skipIntro = true;
}
localStorage.setItem("lastVisit", now)
const titleWindow = document.getElementById("title");
const titleH1 = titleWindow.getElementsByTagName("h1")[0];
const titlep = titleWindow.getElementsByTagName("p")[0];
let offset = 1200;

if (skipIntro) {
    console.debug("skipping intro");
    titleWindow.style.position = "";
    titleH1.style.transition = "2s ease-in-out"
    titleH1.style.opacity = 0;
    titleH1.innerText = "lorentz.app";
    titleH1.style.opacity = 1;
    titlep.style.opacity = 1;
    document.getElementById("bootstrap-cover").style.opacity = 0;
    window.dispatchEvent(new CustomEvent('updateIntersectionBuffer'));
    document.getElementById("bootstrap-cover").style.display = "none";
} else {
    coolHelloMessage()
}

function coolHelloMessage() {
    setTimeout(() => {
        titleH1.style.transition = "0.5s ease-in-out"
        titleH1.style.opacity = 0;
    }, 1000 + offset)

    setTimeout(() => {
        titleH1.innerText = "lorentz.app";
    }, 1500 + offset)

    setTimeout(() => {
        titleH1.style.opacity = 1;
        titlep.style.opacity = 1;
        titleWindow.style.position = "";
        document.getElementById("bootstrap-cover").style.opacity = 0;
        window.dispatchEvent(new CustomEvent('updateIntersectionBuffer'));
    }, 1600 + offset)

    setTimeout(() => {
        document.getElementById("bootstrap-cover").style.display = "none";
    }, 3700 + offset)
}