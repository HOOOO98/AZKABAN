import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-storage.js";


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const responseBox = document.querySelector('.prison');

// Create new Prison Cell element
const createPrisonerCell = (doc) => {
    const { name, prisonerLv, imageURL } = doc.data();
    const cell = document.createElement('div');
    cell.classList.add('prisonCell');
    cell.setAttribute('prisonerLv', prisonerLv);
    cell.setAttribute('dataId', doc.id);
    cell.setAttribute('id', name);
    cell.setAttribute('data-imageurl', imageURL);
    cell.style.backgroundImage = `url(${imageURL})`;
    cell.innerHTML = /*html*/`
        <p class="prisonerName">${name}</p>
        <span class="releaseWord hidden" id="releaseWord">Release</span>
    `;

    // release button click event handler
    const releaseWord = cell.querySelector('.releaseWord');
    releaseWord.addEventListener('click', async () => {
        await deleteDoc(doc.ref);
        cell.remove();
    });

    return cell;
};

// Render Prison Cells
const renderPrisonCells = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "prisoner"));
        responseBox.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const prisonerCell = createPrisonerCell(doc);
            responseBox.appendChild(prisonerCell);
        });
    } catch (error) {
        console.error("Can't see them... do refresh plz ", error);
    }
};

renderPrisonCells();


const openModal = () => {
    const modal = document.querySelector(".modal");
    modal.classList.remove("hidden");
};
const closeModal = () => {
    const modal = document.querySelector(".modal");
    modal.classList.add("hidden");
    document.getElementById('infoForm').reset();
};

document.querySelector(".imprisonBtn").addEventListener("click", openModal);
document.querySelector(".dismissBtn").addEventListener("click", closeModal);
document.querySelector(".modalBg").addEventListener("click", closeModal);

// release prisoner
const releaseWordClickHandler = async (event) => {
    event.stopPropagation();
    const prisonCell = event.currentTarget.parentElement;
    const imageURL = prisonCell.getAttribute('data-imageurl');

    prisonCell.remove();
    await deleteDoc(db, prisonCell.getAttribute('dataId'));
    const fileRef = ref(storage, `mugshot/${imageURL}`);

    deleteObject(fileRef)
        .then(() => {
            console.log('Release prisoner successfully...!');
        })
        .catch((error) => {
            console.error('Sorry something Wrong in release System... ', error);
        });
};


// Release button click
const handleReleaseBtnClick = () => {
    const releaseWords = document.querySelectorAll('.releaseWord');
    releaseWords.forEach(word => {
        word.classList.toggle('hidden');
    });
    const isReleaseActive = [...releaseWords].some(word => !word.classList.contains('hidden'));
    imprisonBtn.disabled = isReleaseActive;
    imprisonBtn.classList.toggle('hidden');
};

// release word button click
const initReleaseWords = () => {
    const releaseWords = document.querySelectorAll('.releaseWord');
    releaseWords.forEach(releaseWord => {
        releaseWord.addEventListener('click', releaseWordClickHandler);
    });
};

const infoForm = document.getElementById('infoForm');
const releaseBtn = document.querySelector('.releaseBtn');
const imprisonBtn = document.querySelector(".imprisonBtn");
const approveBtn = document.querySelector('.approveBtn');

// imprison function
infoForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    approveBtn.disabled = true;

    const prisonerName = document.getElementById('prisonerName').value;
    const prisonerPhoto = document.getElementById('prisonerPhoto').files[0];
    const prisonerLv = document.getElementById('prisonerLv').value;
    const storageRef = ref(storage, `mugshot/${prisonerName}_${Date.now()}`);

    try {
        const uploadTask = uploadBytes(storageRef, prisonerPhoto);
        const snapshot = await uploadTask;    
        const downloadURL = await getDownloadURL(snapshot.ref);

        const newPrisonerCell = document.createElement('div');
        newPrisonerCell.classList.add('prisonCell');
        newPrisonerCell.style.backgroundImage = `url(${downloadURL})`;
        newPrisonerCell.id = `${prisonerName}`;
        newPrisonerCell.setAttribute('prisonerLv', prisonerLv);
        newPrisonerCell.innerHTML = /*html*/`
            <p class="prisonerName">${prisonerName}</p>
            <span class="releaseWord hidden" id="releaseWord">Release</span>
        `;

        responseBox.appendChild(newPrisonerCell);

        const docRef = await addDoc(collection(db, "prisoner"), {
            name: prisonerName,
            prisonerLv: prisonerLv,
            imageURL: downloadURL
        });
                
        const newReleaseWord = newPrisonerCell.querySelector('.releaseWord');
        newReleaseWord.addEventListener('click', () => {
            newPrisonerCell.remove();
        });

        initReleaseWords();
        closeModal();
        location.reload();
    } catch (error) {
        console.error("Can't get the prisoner in the prison... ", error);
    } finally {
        approveBtn.disabled = false;
    }
});

// hide release words
releaseBtn.addEventListener('click', handleReleaseBtnClick);
initReleaseWords();