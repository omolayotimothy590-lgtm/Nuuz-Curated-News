export interface LocationData {
  city: string;
  state: string;
  stateCode: string;
  zipCode: string;
}

interface ZipCodeApiResponse {
  places: Array<{
    'place name': string;
    'state': string;
    'state abbreviation': string;
  }>;
}

export const validateZipCode = async (zipCode: string): Promise<LocationData | null> => {
  if (!zipCode || zipCode.length !== 5 || !/^\d{5}$/.test(zipCode)) {
    return null;
  }

  try {
    const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`);

    if (!response.ok) {
      return null;
    }

    const data: ZipCodeApiResponse = await response.json();

    if (!data.places || data.places.length === 0) {
      return null;
    }

    const place = data.places[0];

    return {
      city: place['place name'],
      state: place['state'],
      stateCode: place['state abbreviation'],
      zipCode,
    };
  } catch (error) {
    console.error('Error validating ZIP code:', error);
    return null;
  }
};

export const saveLocationToStorage = (location: LocationData): void => {
  try {
    localStorage.setItem('user_zip_code', location.zipCode);
    localStorage.setItem('user_location', JSON.stringify({
      city: location.city,
      state: location.state,
      stateCode: location.stateCode,
    }));
  } catch (error) {
    console.error('Error saving location to storage:', error);
  }
};

export const loadLocationFromStorage = (): LocationData | null => {
  try {
    const zipCode = localStorage.getItem('user_zip_code');
    const locationStr = localStorage.getItem('user_location');

    if (!zipCode || !locationStr) {
      return null;
    }

    const location = JSON.parse(locationStr);

    return {
      zipCode,
      city: location.city,
      state: location.state,
      stateCode: location.stateCode,
    };
  } catch (error) {
    console.error('Error loading location from storage:', error);
    return null;
  }
};

export const clearLocationFromStorage = (): void => {
  try {
    localStorage.removeItem('user_zip_code');
    localStorage.removeItem('user_location');
  } catch (error) {
    console.error('Error clearing location from storage:', error);
  }
};
