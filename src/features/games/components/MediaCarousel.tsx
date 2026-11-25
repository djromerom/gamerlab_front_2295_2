import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import ReactPlayer from "react-player";


interface MediaCarouselProps {
    video?: string;
    images: string[]; // Solo imágenes adicionales, NO incluye el logo
    gameImage?: string; // Solo para thumbnail del video
}

export function MediaCarousel({ video, images }: MediaCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Crear array con todos los elementos multimedia (solo video e imágenes adicionales, NO el logo)
    const mediaItems = [];

    // Agregar video como primer elemento si existe
    if (video) {
        const autoThumbnail = getVideoThumbnail(video);
        mediaItems.push({
            type: 'video',
            src: video,
            thumbnail: autoThumbnail
        });
    }

    // Agregar SOLO las imágenes adicionales (no incluir el logo)
    images.forEach((image) => {
        if (image && image.trim() !== '') {
            mediaItems.push({ type: 'image', src: image });
        }
    });

    // Si no hay elementos, mostrar placeholder
    if (mediaItems.length === 0) {
        return (
            <div className="w-full aspect-video rounded-xl overflow-hidden max-h-[550px] landscape:max-h-full bg-gray-800 flex items-center justify-center">
                {/* BG-66: lo ven los visitantes; no se les pide subir nada */}
                <p className="text-gray-400 text-center px-4">Sin video ni imágenes adicionales</p>
            </div>
        );
    }

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
    };

    const currentItem = mediaItems[currentIndex];

    return (
        // En horizontal ocupa el alto de su columna: la imagen se encoge para que las miniaturas sigan a la vista
        <div className="relative w-full landscape:h-full flex flex-col justify-center min-h-0">
            {/* Contenido principal del carrusel */}
            <div className="relative w-full aspect-video rounded-xl overflow-hidden max-h-[550px] min-h-0 shrink bg-black">
                {currentItem.type === 'video' ? (
                    <ReactPlayer
                        src={currentItem.src}
                        width="100%"
                        height="100%"
                        controls
                    />
                ) : (
                    <img
                        src={currentItem.src}
                        alt="Imagen del juego"
                        className="w-full h-full object-contain"
                    />
                )}

                {/* Controles del carrusel (solo si hay más de un elemento y solo en desktop) */}
                {mediaItems.length > 1 && (
                    <>
                        {/* Botón anterior - Solo visible en desktop */}
                        <button
                            onClick={prevSlide}
                            className="cursor-pointer hidden md:block absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white rounded-full p-2 transition-all z-10"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        {/* Botón siguiente - Solo visible en desktop */}
                        <button
                            onClick={nextSlide}
                            className="cursor-pointer hidden md:block absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white rounded-full p-2 transition-all z-10"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </>
                )}
            </div>

            {/* Barra de miniaturas (solo si hay más de un elemento) */}
            {mediaItems.length > 1 && (
                <div className="mt-2 md:mt-4 landscape-short:mt-1 flex justify-center shrink-0">
                    <div className="flex gap-2 md:gap-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 max-w-full px-2 md:px-4 py-2">
                        {mediaItems.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`relative flex-shrink-0 w-16 h-10 sm:w-20 sm:h-[45px] md:w-24 md:h-18 landscape-short:w-16 landscape-short:h-9 rounded-md overflow-hidden transition-all ${index === currentIndex
                                    ? 'ring-2 ring-[#AC7CFF] ring-offset-2 ring-offset-gray-800'
                                    : 'opacity-70 hover:opacity-100'
                                    }`}
                            >
                                {item.type === 'video' ? (
                                    <div className="relative w-full h-full">
                                        <img
                                            src={item.thumbnail || '/placeholder.svg'}
                                            alt={`Video miniatura ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="cursor-pointer absolute inset-0 bg-black/30 flex items-center justify-center">
                                            <div className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center">
                                                <div className="w-0 h-0 border-l-4 border-l-black border-t-2 border-t-transparent border-b-2 border-b-transparent ml-1"></div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <img
                                        src={item.src}
                                        alt={`Miniatura ${index + 1}`}
                                        className="cursor-pointer w-full h-full object-cover"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Función para extraer miniatura automáticamente de la URL del video
const getVideoThumbnail = (videoUrl: string): string => {
    try {
        // YouTube - extraer ID del video y generar URL de miniatura
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const youtubeMatch = videoUrl.match(youtubeRegex);

        if (youtubeMatch && youtubeMatch[1]) {
            const videoId = youtubeMatch[1];
            // Usar miniatura de alta calidad de YouTube
            return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }

        // Para otros servicios de video, usar placeholder
        return '/placeholder.svg';
    } catch (error) {
        return '/placeholder.svg';
    }
};
