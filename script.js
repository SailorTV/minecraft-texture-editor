document.addEventListener('DOMContentLoaded', function () {
    const e1 = document.querySelectorAll('.option');
    const step2Section = document.getElementById('step2');
    const step1Section = document.getElementById('step1');
    const step3Section = document.getElementById('step3');
    const imageGallery = document.getElementById('texturesGallery');
    const downloadButton = document.getElementById('downloadButton');
    const packNameModal = document.getElementById('packNameModal');
    const packNameInput = document.getElementById('packNameInput');
    const confirmPackNameButton = document.getElementById('confirmPackNameButton');
    const closeModal = document.querySelector('.modal .close');
    let packName = '';
    const textureSequence = ['diamond_sword', 'ender_pearl']; // Séquence de textures
    let currentTextureIndex = 0;
    let selectedTextures = {}; // Stocke les textures sélectionnées pour chaque élément

    // Étape 1 : Sélectionner une résolution
    e1.forEach(option => {
        option.addEventListener('click', function () {
            const resolution = option.dataset.resolution;

            if (!resolution) {
                alert('Erreur : Résolution invalide.');
                return;
            }

            step1Section.style.display = 'none';
            step2Section.style.display = 'block';

            // Charger les textures pour le premier élément (diamond_sword)
            loadImageGallery(resolution, textureSequence[currentTextureIndex]);
        });
    });

    // Fonction pour charger la galerie d'images
    function loadImageGallery(resolution, textureType) {
        imageGallery.innerHTML = ''; // Réinitialiser la galerie
        let selectedTexture = null; // Réinitialiser la sélection pour cet élément

        for (let i = 1; i <= 5; i++) {
            const img = document.createElement('img');
            img.src = `textures/${resolution}/${textureType}/image${i}.png`;
            img.alt = `${textureType} Image ${i}`;
            img.classList.add('image-option');

            // Ajouter un événement de clic pour sélectionner une texture
            img.addEventListener('click', function () {
                if (selectedTexture) {
                    selectedTexture.classList.remove('selected');
                }

                img.classList.add('selected');
                selectedTexture = img;

                // Enregistrer la texture sélectionnée
                selectedTextures[textureType] = img.src;

                // Passer automatiquement à l'étape suivante ou afficher le bouton "Télécharger"
                if (currentTextureIndex < textureSequence.length - 1) {
                    currentTextureIndex++; // Incrémenter l'index
                    loadImageGallery(resolution, textureSequence[currentTextureIndex]); // Charger la galerie pour la texture suivante
                } else {
                    step2Section.style.display = 'none';
                    step3Section.style.display = 'block';
                }
            });

            imageGallery.appendChild(img);
        }
    }

    // Téléchargement du pack de textures
    downloadButton.addEventListener('click', function () {
        if (Object.keys(selectedTextures).length !== textureSequence.length) {
            alert('Veuillez sélectionner toutes les textures.');
            return;
        }

        // Afficher le modal pour entrer le nom du pack
        packNameModal.style.display = 'block';
    });

    // Fermer le modal
    closeModal.addEventListener('click', function () {
        packNameModal.style.display = 'none';
    });

    // Confirmer le nom du pack
    confirmPackNameButton.addEventListener('click', function () {
        packName = packNameInput.value.trim();
        if (!packName) {
            alert('Erreur : Nom du pack invalide.');
            return;
        }
        packNameModal.style.display = 'none';

        // Récupérer les URLs des textures sélectionnées
        const urls = Object.values(selectedTextures);
        downloadZips(urls, packName);
    });

    // Fonction pour créer un fichier ZIP avec images en base64
    async function downloadZips(urls, packName) {
        const zip = new JSZip();
        console.log('Démarrage du téléchargement des images...');

        // Ajouter les fichiers pack.mcmeta et pack.png à la racine
        const packMeta = {
            "pack": {
                "pack_format": 6,
                "description": "Mon pack de textures personnalisé"
            }
        };
        zip.file("pack.mcmeta", JSON.stringify(packMeta, null, 2));

        // Charger pack.png depuis le dossier textures
        const packPngBlob = await fetch('textures/pack.png').then(res => res.blob());
        zip.file("pack.png", packPngBlob);

        // Pour chaque URL de texture sélectionnée
        for (let i = 0; i < urls.length; i++) {
            const imageUrl = urls[i];
            const textureType = Object.keys(selectedTextures)[i]; // Obtenir le type de texture correspondant

            // Afficher l'URL pour vérifier
            console.log(`Téléchargement de l'image : ${imageUrl}`);
            
            // Créer un objet FileReader pour lire l'image
            const imageBlob = await fetchImage(imageUrl);
            
            if (imageBlob) {
                console.log(`Ajout de l'image ${imageUrl} au ZIP`);
                console.log(imageBlob); // Log the imageBlob to debug the issue
                // Ajouter l'image dans le ZIP avec le chemin spécifié
                const filePath = `assets/minecraft/textures/items/${textureType}.png`;
                console.log(`Chemin d'accès du fichier ajouté au ZIP : ${filePath}`);
                zip.file(filePath, imageBlob, { binary: true });
            } else {
                console.error(`Erreur avec l'image ${imageUrl}`);
            }
        }

        // Vérifier si des fichiers ont été ajoutés au ZIP
        console.log('Fichiers ajoutés au ZIP:', Object.keys(zip.files));
        if (Object.keys(zip.files).length === 0) {
            alert('Erreur : Aucun fichier n\'a été ajouté au ZIP.');
            return;
        }

        // Générer le fichier ZIP
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = `${packName}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Fonction pour récupérer l'image en tant que Blob via fetch
    async function fetchImage(imageUrl) {
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error(`Erreur de téléchargement: ${imageUrl}`);
            console.log(`Image téléchargée avec succès: ${imageUrl}`);
            return await response.blob();
        } catch (error) {
            console.error(`Erreur de téléchargement pour l'image ${imageUrl}: ${error}`);
            return null;
        }
    }
});
