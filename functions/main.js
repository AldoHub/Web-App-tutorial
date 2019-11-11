const config = {
   //your firebase config here
}

firebase.initializeApp(config);

const firestore = firebase.firestore();

const posts = document.querySelector("#posts");
const createForm = document.querySelector("#createForm");
const progressBar = document.querySelector("#progressBar");
const progressHandler = document.querySelector("#progressHandler");
const postSubmit = document.querySelector("#postSubmit");
const openNav = document.querySelector("#openNav");
const closeNav = document.querySelector("#closeNav"); 
const loading = document.querySelector("#loading");
const editButton = document.querySelector("#edit");
const deleteButton = document.querySelector("#delete");
const singlePost = document.querySelector("#post");
const editFormContainer = document.querySelector("#editFormContainer");
const pagination = document.querySelector("#pagination");
let editMode = false;

let currentTitle;
let currentId;
let currentContent;
let oldPostCover;

let lastVisible;

let postsArray = [];
let size;
let postsSize;


//pagination
const getPosts = async() => {
    let docs;
    let postsRef = firebase.firestore().collection("posts").orderBy("title").limit(3);
    
    let _size = await firebase.firestore().collection("posts").get();
    size = _size.size;

    await postsRef.get().then((documentSnapshots) => {
        docs = documentSnapshots;
       
        lastVisible = documentSnapshots.docs[documentSnapshots.docs.length-1];
        console.log("last", lastVisible);
    }); 

    docs["docs"].forEach(doc => {
        postsArray.push({"id": doc.id, "data": doc.data()});
    })    
    
    if(postsArray.length > 0 ){
        pagination.style.display = "block";
    }else{
        pagination.style.display = "none";
    }
    
    

    await createChildren(postsArray);
    postsSize = posts.childNodes.length;
    console.log(postsSize);
    
    /*
    let docs = await firebase.firestore().collection("posts").get().catch(err => console.log(err));
    docs.forEach(doc => {
        postsArray.push({"id": doc.id, "data": doc.data()});
    });

    createChildren(postsArray);
    */
}

//pagination
const paginate = async() => {
    let docs;
    let postsRef = firebase.firestore().collection("posts").orderBy("title")
    .startAfter(lastVisible).limit(3);

    await postsRef.get().then((documentSnapshots) => {
        docs = documentSnapshots;
       
        lastVisible = documentSnapshots.docs[documentSnapshots.docs.length-1];
        console.log("last", lastVisible);
    }); 

    docs["docs"].forEach((doc, i) => {
        let div = document.createElement("div");
        let cover = document.createElement("div");
        let anchor = document.createElement("a");
        let anchorNode = document.createTextNode(doc.data().title);
        anchor.setAttribute("href", "post.html#/" + doc.id);

        anchor.appendChild(anchorNode);
        cover.style.backgroundImage = "url(" + doc.data().cover + ")";
        div.classList.add("post");
        div.appendChild(cover);
        div.appendChild(anchor);
        posts.append(div);
        postsSize ++;
        console.log(postsSize)
    });
  
    //pagination
    if(postsSize >= size){
        pagination.style.display = "none";
    }
 
    
}

//pagination
if(pagination != null){
    pagination.addEventListener("click", () => {
        //console.log(postsSize, size);
        paginate();
    })
}




const getPost = async() => {
   
    let postId = getPostIdFromURL();
    if(loading != null){
        loading.innerHTML = "<div><div class='lds-circle'><div></div></div><p>Loading Post...</p></div>";
    }

    
    let post = await firebase.firestore().collection("posts").doc(postId).get().catch(err => console.log(err));
   

    currentId = post.id;
    currentContent = post.data().content;
    currentTitle = post.data().title;
    oldPostCover = post.data().fileref;

    if(loading !=null){
        loading.innerHTML = "";
    }
    
    if(post && deleteButton != null){
        deleteButton.style.display = "block";
    }
    
    if(post && editButton != null){
        editButton.style.display = "block";
    }

    createChild(post.data());
}


const createChild = (postData) =>{
    if(singlePost !== null){
        let div = document.createElement("div");
        let img = document.createElement("img");
        img.setAttribute("src", postData.cover);
        img.setAttribute("loading", "lazy");

        let title = document.createElement("h3");
        let titleNode = document.createTextNode(postData.title);
        title.appendChild(titleNode);

        let content = document.createElement("div");
        let contentNode = document.createTextNode(postData.content);
        content.appendChild(contentNode);

        div.appendChild(img);
        div.appendChild(title);
        div.appendChild(content);
        
        post.appendChild(div);
       
    }
}


const getPostIdFromURL = () => {
    let postLocation = window.location.href;
    let hrefArray = postLocation.split("/");
    let postId = hrefArray.slice(-1).pop();
    
    return postId;
}

const createChildren = async(arr) => {
    if(posts != null){
        arr.map( post => {
            let div = document.createElement("div");
            let cover = document.createElement("div");
            let anchor = document.createElement("a");
            let anchorNode = document.createTextNode(post.data.title);
            anchor.setAttribute("href", "post.html#/" + post.id);

            anchor.appendChild(anchorNode);
            cover.style.backgroundImage = "url(" + post.data.cover + ")";
            div.classList.add("post");
            div.appendChild(cover);
            div.appendChild(anchor);
            posts.appendChild(div);
        });
        
    }
}


const appendEditForm = async() => {
    //let postId = getPostIdFromURL();
    //let post = await firebase.firestore().collection("posts").doc(postId).get().catch(err => console.log(err));
    let d;


    let form = document.createElement("form");
    form.setAttribute("method", "POST");
    form.setAttribute("id", "editForm");

    let titleInput = document.createElement("input");
    titleInput.setAttribute("value", currentTitle);
    titleInput.setAttribute("id", "editTitle");

    let contentTextarea = document.createElement("textarea");
    contentTextarea.setAttribute("id", "editContent");

    let coverFile = document.createElement("input");
    coverFile.setAttribute("type", "file");
    coverFile.setAttribute("id", "editCover");

    let oldCover = document.createElement("input");
    oldCover.setAttribute("type", "hidden");
    oldCover.setAttribute("id", "oldCover");

    let submit = document.createElement("input");
    submit.setAttribute("value", "Update Post");
    submit.setAttribute("type", "submit");
    submit.setAttribute("id", "editSubmit");  


    form.appendChild(titleInput);
    form.appendChild(contentTextarea);
    form.appendChild(coverFile);
    form.appendChild(oldCover);
    form.appendChild(submit);   
    editFormContainer.appendChild(form);

    document.getElementById("editContent").value = currentContent;
    document.getElementById("oldCover").value = oldPostCover;

    document.querySelector("#editForm").addEventListener("submit", async(e) => {
        e.preventDefault();

        //const postId = await getPostIdFromURL();
        
        if(document.getElementById("editTitle").value != "" && document.getElementById("editContent").value != ""){

            if(document.getElementById("editCover").files[0] !== undefined ){
                const cover = document.getElementById("editCover").files[0];
                const storageRef = firebase.storage().ref();
                const storageChild = storageRef.child(cover.name);

                console.log("updating file...");

                const postCover = storageChild.put(cover);

                await new Promise((resolve) => {
                    postCover.on("state_changed", (snapshot) => {

                        let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log(Math.trunc(progress));

                        if(progressHandler != null){
                            progressHandler.style.display = "block";
                        }

                        if(postSubmit != null){
                            postSubmit.disabled = true;
                        }

                        if(progressBar != null){
                            progressBar.value = progress;
                        }
                    }, (error) => {
                        //error
                        console.log(error);
                    }, async() => {
                        const downloadURL = await storageChild.getDownloadURL();
                        d = downloadURL;
                        console.log(d);
                        resolve();
                    });
                });
                
                const fileRef = await firebase.storage().refFromURL(d);
                console.log(oldPostCover)

                await storageRef.child(oldPostCover).delete().catch(err => {
                    console.log(err);
                });
 
                console.log("Previous image deleted successfully");
 
                let post = {
                    title: document.getElementById("editTitle").value,
                    content : document.getElementById("editContent").value,
                    cover: d,
                    fileref: fileRef.location.path
                } 

                console.log(post);

                await firebase.firestore().collection("posts").doc(currentId).set(post, {merge: true});
                location.reload();

            }else{
                await firebase.firestore().collection("posts").doc(currentId).set({
                    title: document.getElementById("editTitle").value,
                    content: document.getElementById("editContent").value
                }, {merge: true});

                location.reload();
            }

        }else{
            console.log("You need to fill the inputs");
        }


    });

}

if(editButton != null){
    editButton.addEventListener("click", () => {
        if(editMode == false){
            editMode = true;
            console.log("Enabling Edit Mode");
        
            appendEditForm();
        }else{
            editMode = false;
            console.log("Disabling Edit Mode");

            removeEditForm();
        }
    })
}


const removeEditForm = () => {
    let editForm = document.getElementById("editForm");
    editFormContainer.removeChild(editForm);
}


if(createForm != null){
    let d;
    createForm.addEventListener("submit", async(e) =>{
        e.preventDefault();

        if(document.getElementById("title").value != "" && document.getElementById("content").value != "" && document.getElementById("cover").files[0] != "") {

            let title = document.getElementById("title").value;
            let content = document.getElementById("content").value;
            let cover = document.getElementById("cover").files[0];
            console.log(cover);

            const storageRef = firebase.storage().ref();
            const storageChild = storageRef.child(cover.name);

            console.log("Uploading file...");
            const postCover = storageChild.put(cover);

            await new Promise((resolve) => {
                postCover.on("state_changed", (snapshot) => {

                    let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log(Math.trunc(progress));

                    if(progressHandler != null){
                        progressHandler.style.display = "block";
                    }

                    if(postSubmit != null){
                        postSubmit.disabled = true;
                    }

                    if(progressBar != null){
                        progressBar.value = progress;
                    }
                }, (error) => {
                    //error
                    console.log(error);
                }, async() => {
                    const downloadURL = await storageChild.getDownloadURL();
                    d = downloadURL;
                    console.log(d);
                    resolve();
                });
            });  
            
            
            const fileRef = await firebase.storage().refFromURL(d);

            let post = {
                title,
                content,
                cover: d,
                fileref: fileRef.location.path 
            }

            await firebase.firestore().collection("posts").add(post);
            console.log("post added successfully");

            if(postSubmit != null){
                window.location.replace("index.html");
                postSubmit.disabled = false;
            }


        }else{
            console.log("must fill all the inputs")
        }

    });
}


if(deleteButton !== null){
    deleteButton.addEventListener("click", async() => {

        //const postId = getPostIdFromURL();
        //let post = await firebase.firestore().collection("posts").doc(postId).get().catch(err => console.log(err));

        const storageRef = firebase.storage().ref();
        await storageRef.child(oldPostCover).delete().catch(err => console.log(err));

        await firebase.firestore().collection("posts").doc(currentId).delete();

        window.location.replace("index.html");

    });
}




//check if the DOM is fully loaded
document.addEventListener("DOMContentLoaded", (e) => {
    getPosts();
    if(!location.href.includes("index.html") && !location.href.includes("create.html") ){
        getPost();
    }
   
});



//nav functions
openNav.addEventListener("click", (e) => {
    document.getElementById("nav").style.width = "250px";
    document.getElementById("main").style.marginLeft = "250px";
});

closeNav.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("nav").style.width = "0";
    document.getElementById("main").style.marginLeft = "";
})

