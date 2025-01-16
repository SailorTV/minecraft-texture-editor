document.addEventListener('DOMContentLoaded', function () {
    const e1 = document.querySelectorAll('.option');
    const step2Section = document.getElementById('step2');
    const step1Section = document.getElementById('step1');
    const step3Section = document.getElementById('step3');
    const imageGallery = document.getElementById('texturesGallery');
    const downloadButton = document.getElementById('downloadButton');
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

        // Récupérer les URLs des textures sélectionnées
        const urls = Object.values(selectedTextures);
        downloadZips(urls);
    });

    // Fonction pour créer un fichier ZIP avec images en base64
    async function downloadZips(urls) {
        const zip = new JSZip();
        console.log('Démarrage du téléchargement des images...');

        // Pour chaque URL de texture sélectionnée
        for (let i = 0; i < urls.length; i++) {
            const imageUrl = urls[i];

            // Afficher l'URL pour vérifier
            console.log(`Téléchargement de l'image : ${imageUrl}`);
            
            // Créer un objet FileReader pour lire l'image
            const imageBlob = await fetchImage(imageUrl);
            
            if (imageBlob) {
                console.log(`Ajout de l'image ${imageUrl} au ZIP`);
                // Ajouter l'image dans le ZIP
                zip.file(`textures/image${i + 1}.png`, imageBlob, { binary: true });
            } else {
                console.error(`Erreur avec l'image ${imageUrl}`);
            }
        }

        // Générer le fichier ZIP
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = 'textures_pack.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Fonction pour récupérer l'image en tant que Blob via fetch
    async function fetchImage(imageUrl) {
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error(`Erreur de téléchargement: ${imageUrl}`);
            return await response.blob();
        } catch (error) {
            console.error(`Erreur de téléchargement pour l'image ${imageUrl}: ${error}`);
            return null;
        }
    }
});
