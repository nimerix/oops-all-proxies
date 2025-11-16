import axios from "axios";
import {
  Button,
  Checkbox,
  Label,
  Modal,
  ModalBody,
  ModalHeader,
  TextInput,
} from "flowbite-react";
import { useState, useEffect, useRef } from "react";
import { API_BASE } from "../constants";
import { pngToNormal, getLocalBleedImageUrl } from "../helpers/ImageHelper";
import { useArtworkModalStore } from "../store";
import { useCardsStore } from "../store/cards";
import type { CardOption } from "../types/Card";

interface ScryfallSet {
  code: string;
  name: string;
}

export function ArtworkModal() {
  const [isGettingMore, setIsGettingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [applyToAll, setApplyToAll] = useState(false);
  const [allPrints, setAllPrints] = useState<CardOption[]>([]);
  const [setFilter, setSetFilter] = useState("");
  const [availableSets, setAvailableSets] = useState<ScryfallSet[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isModalOpen = useArtworkModalStore((state) => state.open);
  const modalCard = useArtworkModalStore((state) => state.card);
  const modalIndex = useArtworkModalStore((state) => state.index);
  const autoFetchPrints = useArtworkModalStore((state) => state.autoFetchPrints);
  const closeArtworkModal = useArtworkModalStore((state) => state.closeModal);
  const updateArtworkCard = useArtworkModalStore((state) => state.updateCard);

  const cards = useCardsStore((state) => state.cards);
  const updateCard = useCardsStore((state) => state.updateCard);

  const originalSelectedImages = useCardsStore(
    (state) => state.originalSelectedImages
  );
  const appendOriginalSelectedImages = useCardsStore(
    (state) => state.appendOriginalSelectedImages
  );

  const clearSelectedImage = useCardsStore((state) => state.clearSelectedImage);
  const clearManySelectedImages = useCardsStore(
    (state) => state.clearManySelectedImages
  );

  const appendCachedImageUrls = useCardsStore(
    (state) => state.appendCachedImageUrls
  );

  // Fetch full set names from server
  async function fetchSetNames(setCodes: string[]): Promise<Map<string, string>> {
    const setMap = new Map<string, string>();

    try {
      // Fetch all sets from server
      const response = await axios.get(`${API_BASE}/api/cards/images/sets`);
      const allSets = response.data.data;

      // Build a map of set codes to set names
      setCodes.forEach(code => {
        const matchingSet = allSets.find(
          (s: any) => s.code?.toLowerCase() === code.toLowerCase()
        );
        if (matchingSet) {
          setMap.set(code, matchingSet.name);
        } else {
          setMap.set(code, code); // fallback to code if not found
        }
      });
    } catch (error) {
      console.warn("Failed to fetch set names from server:", error);
      // Fallback: use codes as names
      setCodes.forEach(code => setMap.set(code, code));
    }

    return setMap;
  }

  async function getMoreCards() {
    if (!modalCard) return;
    setIsGettingMore(true);
    try {
      const res = await axios.post<CardOption[]>(
        `${API_BASE}/api/cards/images`,
        { cardNames: [modalCard.name], cardArt: "prints" }
      );


      if (!res.data || res.data.length === 0) {
        console.warn(`[ArtworkModal] No prints found for "${modalCard.name}"`);
        return;
      }

      // Combine imageUrls from all prints
      const allUrls: string[] = [];
      let firstCardData = res.data[0];

      for (const cardData of res.data) {
        // Extract imageUrls from either the direct property or from faces
        let urls = cardData.imageUrls ?? [];
        if (urls.length === 0 && cardData.faces && cardData.faces.length > 0) {
          urls = cardData.faces.map(face => face.imageUrl).filter(Boolean);
        }
        allUrls.push(...urls);
      }


      // Store all prints for later lookup
      setAllPrints(res.data);

      updateArtworkCard({
        imageUrls: allUrls,
        faces: firstCardData.faces,
        layout: firstCardData.layout,
        set: firstCardData.set,
        number: firstCardData.number,
      });
    } finally {
      setIsGettingMore(false);
    }
  }

  // Extract unique sets from all prints and fetch full names
  useEffect(() => {
    if (allPrints.length > 0) {
      const uniqueSetCodes = new Set<string>();

      allPrints.forEach(print => {
        if (print.set) {
          uniqueSetCodes.add(print.set.toUpperCase());
        }
      });

      const codes = Array.from(uniqueSetCodes);

      // Fetch set names asynchronously
      fetchSetNames(codes).then(setNameMap => {
        const sets: ScryfallSet[] = codes.map(code => ({
          code: code,
          name: setNameMap.get(code) || code
        }));
        setAvailableSets(sets.sort((a, b) => a.code.localeCompare(b.code)));
      });
    }
  }, [allPrints]);

  // Auto-fetch all prints when modal opens (unless card already has multiple images)
  useEffect(() => {
    if (isModalOpen && modalCard) {
      // Only fetch if we don't already have multiple artwork options
      const hasMultipleOptions = (modalCard.imageUrls?.length ?? 0) > 1;
      if (!hasMultipleOptions || autoFetchPrints) {
        getMoreCards();
      }
    } else {
      // Clear prints data when modal closes
      setAllPrints([]);
      setSetFilter("");
      setAvailableSets([]);
      setSearchQuery("");
      setAutocompleteSuggestions([]);
      setShowDropdown(false);
    }
  }, [isModalOpen, autoFetchPrints]);

  // Debounced autocomplete for card replacement
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const query = searchQuery.trim();

    if (query.length < 2) {
      setAutocompleteSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Use server's autocomplete endpoint
        const res = await axios.get(
          `${API_BASE}/api/cards/images/autocomplete?q=${encodeURIComponent(query)}`
        );

        if (res.data && res.data.data && res.data.data.length > 0) {
          setAutocompleteSuggestions(res.data.data.slice(0, 10));
          setShowDropdown(true);
        } else {
          setAutocompleteSuggestions([]);
          setShowDropdown(false);
        }
      } catch (error) {
        console.error("Autocomplete failed:", error);
        setAutocompleteSuggestions([]);
        setShowDropdown(false);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  // Helper function to fetch and replace card by name
  async function fetchAndReplaceCard(cardName: string) {
    if (modalIndex === null || !modalCard) return;

    try {
      setIsSearching(true);
      const res = await axios.post<CardOption[]>(
        `${API_BASE}/api/cards/images`,
        { cardNames: [cardName] }
      );

      if (!res.data || res.data.length === 0) {
        console.warn("No card found for:", cardName);
        return;
      }

      const newCard = res.data[0];

      // Extract imageUrls from either the direct property or from faces
      let urls = newCard.imageUrls ?? [];
      if (urls.length === 0 && newCard.faces && newCard.faces.length > 0) {
        urls = newCard.faces.map(face => face.imageUrl).filter(Boolean);
      }

      if (!urls.length) return;

      const oldUuid = modalCard.uuid;
      const newUuid = crypto.randomUUID();
      const firstImageUrl = urls[0];

      // Clean up old card's data from all stores
      const clearVolatileForCard = useCardsStore.getState().clearVolatileForCard;
      clearVolatileForCard(oldUuid);

      updateCard(modalIndex, {
        uuid: newUuid,
        name: newCard.name,
        imageUrls: urls,
        isUserUpload: false,
        faces: newCard.faces,
        layout: newCard.layout,
        set: newCard.set,
        number: newCard.number,
        currentFaceIndex: 0,
      });

      updateArtworkCard({
        uuid: newUuid,
        name: newCard.name,
        imageUrls: urls,
        isUserUpload: false,
        faces: newCard.faces,
        layout: newCard.layout,
        set: newCard.set,
        number: newCard.number,
      });

      appendOriginalSelectedImages({
        [newUuid]: firstImageUrl,
      });

      appendCachedImageUrls({
        [newUuid]: getLocalBleedImageUrl(firstImageUrl),
      });

      clearSelectedImage(newUuid);

      setSearchQuery("");
      setAutocompleteSuggestions([]);
      setShowDropdown(false);

      // Fetch all prints for the new card
      getMoreCards();
    } catch (error) {
      console.error("Failed to fetch card:", error);
    } finally {
      setIsSearching(false);
    }
  }

  // Filter autocomplete suggestions based on input
  const filteredSetSuggestions = availableSets.filter(set => {
    if (!setFilter.trim()) return true;
    const filterLower = setFilter.trim().toLowerCase();
    return set.code.toLowerCase().includes(filterLower) ||
           set.name.toLowerCase().includes(filterLower);
  });

  // Filter images based on set filter (supports both code and name)
  const filteredImageUrls = modalCard ? ((): string[] => {
    if (!setFilter.trim()) {
      return modalCard.imageUrls;
    }

    const filterUpper = setFilter.trim().toUpperCase();
    const filtered: string[] = [];

    // Find matching set code (user might have typed the name)
    const matchingSet = availableSets.find(
      s => s.code.toUpperCase() === filterUpper ||
           s.name.toUpperCase() === filterUpper ||
           s.name.toUpperCase().includes(filterUpper)
    );

    const targetSetCode = matchingSet ? matchingSet.code : filterUpper;

    allPrints.forEach(print => {
      if (print.set?.toUpperCase() === targetSetCode) {
        const urls = print.imageUrls ?? [];
        filtered.push(...urls);
      }
    });

    return filtered;
  })() : [];

  return (
    <Modal
      show={isModalOpen}
      onClose={() => closeArtworkModal()}
      size="4xl"
      dismissible
    >
      <ModalHeader>Select Artwork</ModalHeader>
      <ModalBody>
        <div className="mb-4 relative" ref={dropdownRef}>
          <TextInput
            type="text"
            placeholder="Replace with a different card..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              e.stopPropagation();

              if (autocompleteSuggestions.length > 0) {
                fetchAndReplaceCard(autocompleteSuggestions[0]);
              }
            }}
          />
          {isSearching && (
            <div className="absolute right-3 top-3 text-gray-400">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
          {showDropdown && autocompleteSuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-80 overflow-y-auto">
              {autocompleteSuggestions.map((cardName, idx) => (
                <div
                  key={idx}
                  className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                  onClick={() => fetchAndReplaceCard(cardName)}
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {cardName}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {modalCard && (
          <>
            <div className="mb-4">
              <Label htmlFor="set-filter" className="mb-2">
                Filter by Set
              </Label>
              <TextInput
                id="set-filter"
                type="text"
                placeholder="Enter set code or name (e.g., MID, Midnight Hunt)..."
                value={setFilter}
                onChange={(e) => setSetFilter(e.target.value)}
                list="available-sets"
              />
              <datalist id="available-sets">
                {filteredSetSuggestions.flatMap(set => [
                  <option key={`${set.code}-code`} value={set.code}>
                    {set.name}
                  </option>,
                  set.code !== set.name && (
                    <option key={`${set.code}-name`} value={set.name}>
                      {set.code}
                    </option>
                  )
                ]).filter(Boolean)}
              </datalist>
              <div className="flex items-center justify-between mt-1">
                {setFilter && (
                  <button
                    onClick={() => setSetFilter("")}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Clear filter
                  </button>
                )}
                {filteredImageUrls.length > 0 && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {filteredImageUrls.length} artwork{filteredImageUrls.length !== 1 ? 's' : ''} {setFilter ? 'in this set' : 'available'}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Checkbox
                id="apply-to-all"
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
              />
              <Label htmlFor="apply-to-all">
                Apply to all cards named "{modalCard?.name}"
              </Label>
            </div>

            {filteredImageUrls.length === 0 && setFilter && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No artworks found for set "{setFilter.toUpperCase()}". Try a different set code or clear the filter.
              </div>
            )}

            <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
              {filteredImageUrls.map((pngUrl, i) => {
                const thumbUrl = pngToNormal(pngUrl);
                return (
                  <img
                    key={i}
                    src={thumbUrl}
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = pngUrl;
                    }} // fallback
                    className={`w-full cursor-pointer border-4 ${originalSelectedImages[modalCard.uuid] === pngUrl
                        ? "border-green-500"
                        : "border-transparent"
                      }`}
                    onClick={async (e) => {
                      // Find which print this URL belongs to and which face was clicked
                      let matchingPrint: CardOption | undefined;
                      let clickedFaceIndex = 0;

                      for (const print of allPrints) {
                        const printUrls = print.imageUrls ?? [];
                        const urlIndex = printUrls.indexOf(pngUrl);
                        if (urlIndex !== -1) {
                          matchingPrint = print;
                          // Find which face this URL represents
                          if (print.faces && print.faces.length > 0) {
                            const faceIndex = print.faces.findIndex(f => f.imageUrl === pngUrl);
                            if (faceIndex !== -1) {
                              clickedFaceIndex = faceIndex;
                            }
                          }
                          break;
                        }
                      }

                      // For double-faced cards, always use the front face (index 0) as the primary image
                      // The currentFaceIndex tracks which face was clicked
                      const primaryImageUrl = matchingPrint?.faces && matchingPrint.faces.length > 0
                        ? matchingPrint.faces[0].imageUrl
                        : pngUrl;

                      // Apply to all if checkbox is checked OR Shift is held
                      if (applyToAll || e.shiftKey) {
                        const newOriginalSelectedImages: Record<
                          string,
                          string
                        > = {};
                        const cachedUpdates: Record<string, string> = {};
                        const uuidsToClear: string[] = [];

                        cards.forEach((card) => {
                          if (card.name === modalCard.name) {
                            newOriginalSelectedImages[card.uuid] = primaryImageUrl;
                            cachedUpdates[card.uuid] =
                              getLocalBleedImageUrl(primaryImageUrl);
                            uuidsToClear.push(card.uuid);

                            // Update card metadata to match the selected print
                            if (matchingPrint && modalIndex !== null) {
                              updateCard(cards.indexOf(card), {
                                faces: matchingPrint.faces,
                                layout: matchingPrint.layout,
                                set: matchingPrint.set,
                                number: matchingPrint.number,
                                currentFaceIndex: clickedFaceIndex,
                              });
                            }
                          }
                        });

                        appendOriginalSelectedImages(
                          newOriginalSelectedImages
                        );
                        appendCachedImageUrls(cachedUpdates);
                        clearManySelectedImages(uuidsToClear);

                      } else {
                        appendOriginalSelectedImages({
                          [modalCard.uuid]: primaryImageUrl,
                        });

                        appendCachedImageUrls({
                          [modalCard.uuid]: getLocalBleedImageUrl(primaryImageUrl),
                        });

                        // Update the card's metadata to match the selected print
                        if (matchingPrint && modalIndex !== null) {
                          updateCard(modalIndex, {
                            faces: matchingPrint.faces,
                            layout: matchingPrint.layout,
                            set: matchingPrint.set,
                            number: matchingPrint.number,
                            currentFaceIndex: clickedFaceIndex,
                          });
                        }

                        clearSelectedImage(modalCard.uuid);
                      }

                      closeArtworkModal();
                    }}
                  />
                );
              })}
            </div>

            <Button
              className="w-full"
              color="blue"
              onClick={getMoreCards}
              disabled={isGettingMore}
            >
              {isGettingMore ? "Loading prints..." : "Get All Prints"}
            </Button>
          </>
        )}
      </ModalBody>
    </Modal>
  );
}
