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
    const textureSequence = [
        'ender_pearl', 'potion', 'strenghtstick', 'healstick', 'hangglider', 
        'paladium_bow', 'potion_launcher', 'cave_block', 'slime_green', 'stickofgod', 
        'armure_paladium', 'paladium_sword', 'paladium_green_sword', 'icons'
    ]; // Séquence de textures
    const resolutions = ['8x8', '16x16', '32x32', '64x64', '128x128', '256x256'];
    let currentTextureIndex = 0;
    let selectedTextures = {}; // Stocke les textures sélectionnées pour chaque élément
    let selectedResolution = ''; // Ajouter cette ligne pour stocker la résolution sélectionnée

    // Indices indépendants pour chaque type de texture nécessitant des images associées
    let potionIndex = 1;
    let paladiumBowIndex = 1;
    let armurePaladiumIndex = 1;

    // Étape 1 : Sélectionner une résolution
    e1.forEach(option => {
        option.addEventListener('click', function () {
            const resolution = option.dataset.resolution;

            if (!resolution) {
                alert('Erreur : Résolution invalide.');
                return;
            }

            selectedResolution = resolution; // Stocker la résolution sélectionnée
            step1Section.style.display = 'none';
            step2Section.style.display = 'block';

            // Charger les textures pour le premier élément
            loadImageGallery(resolution, textureSequence[currentTextureIndex]);
        });
    });

    // Fonction pour créer un conteneur d'icône zoomée
    function createZoomedIconContainer(src) {
        const container = document.createElement('div');
        container.classList.add('zoomed-icon-container');

        const img = document.createElement('img');
        img.src = src;
        img.classList.add('zoomed-icon');

        container.appendChild(img);
        return container;
    }

    // Fonction pour vérifier l'existence d'une image
    async function imageExists(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // Fonction pour charger la galerie d'images
    async function loadImageGallery(resolution, textureType) {
        imageGallery.innerHTML = ''; // Réinitialiser la galerie
        let selectedTexture = null; // Réinitialiser la sélection pour cet élément

        let i = 1;
        while (true) {
            const imgSrc = `textures/${resolution}/${textureType}/image${i}.png`;
            if (!(await imageExists(imgSrc))) break;

            let imageContainer;

            if (textureType === 'icons') {
                imageContainer = createZoomedIconContainer(imgSrc);
            } else {
                imageContainer = document.createElement('div');
                imageContainer.classList.add('image-container');

                const img = document.createElement('img');
                img.src = imgSrc;
                img.alt = `${textureType} Image ${i}`;
                img.classList.add('image-option');

                imageContainer.appendChild(img);
            }

            // Ajouter un événement de clic pour sélectionner une texture
            imageContainer.addEventListener('click', function () {
                if (selectedTexture) {
                    selectedTexture.classList.remove('selected');
                }

                imageContainer.classList.add('selected');
                selectedTexture = imageContainer;

                // Enregistrer la texture sélectionnée
                selectedTextures[textureType] = imgSrc;

                // Passer automatiquement à l'étape suivante ou afficher le bouton "Télécharger"
                if (currentTextureIndex < textureSequence.length - 1) {
                    currentTextureIndex++; // Incrémenter l'index
                    loadImageGallery(resolution, textureSequence[currentTextureIndex]); // Charger la galerie pour la texture suivante
                } else {
                    step2Section.style.display = 'none';
                    step3Section.style.display = 'block';
                }
            });

            imageGallery.appendChild(imageContainer);
            i++;
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
        packName = `&6${packName} ${selectedResolution}`; // Ajouter &6 et la résolution sélectionnée au nom du pack
        packNameModal.style.display = 'none';

        // Récupérer les URLs des textures sélectionnées
        const urls = Object.values(selectedTextures);
        downloadZips(urls, packName, selectedResolution); // Passer la résolution sélectionnée
    });

    // Fonction pour créer un fichier ZIP avec images en base64
    async function downloadZips(urls, packName, resolution) {
        const zip = new JSZip();
        console.log('Démarrage du téléchargement des images...');

        // Ajouter les fichiers pack.mcmeta et pack.png à la racine
        const packMeta = {
            "pack": {
                "pack_format": 7,
                "description": "Mon pack de textures personnalisé mis à jour"
            }
        };
        zip.file("pack.mcmeta", JSON.stringify(packMeta, null, 2));

        // Sélectionner aléatoirement une image pour pack.png
        const randomIndex = Math.floor(Math.random() * 5) + 1;
        const packPngUrl = `textures/pack/image${randomIndex}.png`;
        const packPngBlob = await fetchImage(packPngUrl);
        if (packPngBlob) {
            zip.file("pack.png", packPngBlob);
        }

        // Pour chaque URL de texture sélectionnée
        for (let i = 0; i < urls.length; i++) {
            const imageUrl = urls[i];
            const textureType = Object.keys(selectedTextures)[i]; // Obtenir le type de texture correspondant

            // Créer un objet FileReader pour lire l'image
            const imageBlob = await fetchImage(imageUrl);
            
            if (imageBlob) {
                // Déterminer le chemin du fichier dans le ZIP
                let filePath;
                if (textureType === 'potion') {
                    filePath = `assets/minecraft/textures/items/${textureType}.png`;
                    zip.file(filePath, imageBlob, { binary: true });

                    // Ajouter les images associées
                    const associatedImages = ['potion_bottle_drinkable.png', 'potion_bottle_empty.png', 'potion_bottle_splash.png', 'potion overlay.png'];
                    for (const image of associatedImages) {
                        const associatedImageUrl = `textures/${resolution}/potion/potion${potionIndex}/${image}`;
                        const associatedImageBlob = await fetchImage(associatedImageUrl);
                        if (associatedImageBlob) {
                            const associatedFilePath = `assets/minecraft/textures/items/${image}`;
                            zip.file(associatedFilePath, associatedImageBlob, { binary: true });
                        }
                    }
                } else if (textureType === 'paladium_bow') {
                    const folderPath = `textures/${resolution}/paladium_bow/paladium_bow${paladiumBowIndex}/`;
                    const files = ['paladium_bow.png', 'paladium_bow_0.png', 'paladium_bow_1.png', 'paladium_bow_2.png', 'paladium_bow_3.png'];
                    for (const file of files) {
                        const fileUrl = `${folderPath}${file}`;
                        const fileBlob = await fetchImage(fileUrl);
                        if (fileBlob) {
                            const filePath = `assets/palamod/textures/items/weapons/${file}`;
                            zip.file(filePath, fileBlob, { binary: true });
                        }
                    }
                } else if (textureType === 'armure_paladium') {
                    const folderPath = `textures/${resolution}/armure_paladium/armure_paladium${armurePaladiumIndex}/`;
                    const files = [
                        'paladium_boots.png', 'paladium_leggings.png', 'paladium_chestplate.png', 'paladium_helmet.png',
                        'paladium_armor_1.png', 'paladium_armor_2.png',
                        'paladium_green_boots.png', 'paladium_green_leggings.png', 'paladium_green_chestplate.png', 'paladium_green_helmet.png'
                    ];
                    const modelFiles = [
                        'paladium_armor_1.png', 'paladium_armor_2.png',
                        'paladium_green_armor_1.png', 'paladium_green_armor_2.png'
                    ];
                    for (const file of files) {
                        const fileUrl = `${folderPath}${file}`;
                        const fileBlob = await fetchImage(fileUrl);
                        if (fileBlob) {
                            const filePath = `assets/palamod/textures/items/${file}`;
                            zip.file(filePath, fileBlob, { binary: true });
                        }
                    }
                    for (const file of modelFiles) {
                        const fileUrl = `${folderPath}${file}`;
                        const fileBlob = await fetchImage(fileUrl);
                        if (fileBlob) {
                            const filePath = `assets/palamod/textures/models/${file}`;
                            zip.file(filePath, fileBlob, { binary: true });
                        }
                    }
                } else if (textureType === 'icons') {
                    filePath = `assets/minecraft/textures/gui/icons.png`;
                    zip.file(filePath, imageBlob, { binary: true });
                } else if (['strenghtstick', 'healstick', 'hangglider', 'stickofgod', 'paladium_sword', 'paladium_green_sword'].includes(textureType)) {
                    filePath = `assets/palamod/textures/items/${textureType}.png`;
                    zip.file(filePath, imageBlob, { binary: true });
                } else if (textureType === 'cave_block') {
                    filePath = `assets/palamod/textures/blocks/caveblock/${textureType}.png`;
                    zip.file(filePath, imageBlob, { binary: true });
                } else if (textureType === 'slime_green') {
                    filePath = `assets/palamod/textures/blocks/slime/${textureType}.png`;
                    zip.file(filePath, imageBlob, { binary: true });
                } else if (textureType === 'potion_launcher') {
                    const associatedImageUrl = `textures/${resolution}/${textureType}/image1.png`;
                    const associatedImageBlob = await fetchImage(associatedImageUrl);
                    if (associatedImageBlob) {
                        filePath = `assets/palamod/textures/items/weapons/${textureType}.png`;
                        zip.file(filePath, associatedImageBlob, { binary: true });
                    }
                } else {
                    filePath = `assets/minecraft/textures/items/${textureType}.png`;
                    zip.file(filePath, imageBlob, { binary: true });
                }
            }
        }

        // Vérifier si des fichiers ont été ajoutés au ZIP
        if (Object.keys(zip.files).length === 0) {
            alert('Erreur : Aucun fichier n a été ajouté au ZIP.');
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
            if (!response.ok) return null;
            return await response.blob();
        } catch (error) {
            return null;
        }
    }
});
