import {
  configureStore,
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";
import { API_KEY, TMDB_BASE_URL } from "../utils/constants.js";
import axios from "axios";

const initialState = {
  movies: [],
  genresLoaded: false,
  genres: [],
};

// API request
export const getGenres = createAsyncThunk("/netflix/genre", async () => {
  try {
    const {
      data: { genres },
    } = await axios.get(`${TMDB_BASE_URL}/genre/movie/list?api_key=${API_KEY}`);
    return genres;
  } catch (error) {
    console.log(error.message);
  }
});

const createArrayFromRawData = (results, moviesArray, genres) => {
  results.forEach((movie) => {
    const movieGenres = [];
    movie.genre_ids.forEach((genre) => {
      const name = genres.find(({ id }) => id === genre);
      if (name) {
        return movieGenres.push(name.name);
      }
    });
    if (movie.backdrop_path) {
      moviesArray.push({
        id: movie.id,
        name: movie?.original_name ? movie.original_name : movie.original_title,
        image: movie.backdrop_path,
        genres: movieGenres.slice(0, 3),
      });
    }
  });
};

const getRawData = async (api, genres, paging) => {
  const moviesArray = [];
  for (let i = 1; moviesArray.length < 60 && i <= 10; i++) {
    const {
      data: { results },
    } = await axios.get(`${api}${paging ? `&page=${i}` : ""}`);
    createArrayFromRawData(results, moviesArray, genres);
  }
  return moviesArray;
};

export const fetchMovies = createAsyncThunk(
  "/netflix/trending",
  ({ type }, thunkApi) => {
    const {
      netflix: { genres },
    } = thunkApi.getState();
    return getRawData(
      `${TMDB_BASE_URL}/trending/${type}/week?api_key=${API_KEY}`,
      genres,
      true
    );
  }
);

export const fetchLikedMovies = createAsyncThunk(
  "/netflix/liked",
  async (email) => {
    const {
      data: { movies },
    } = await axios.get(`http://localhost:8080/api/user/likedMovies/${email}`);
    return movies;
  }
);

export const removeFromLikedMovies = createAsyncThunk(
  "/netflix/remove",
  async ({email, movieId}) => {
    const {
      data: { movies },
    } = await axios.put("http://localhost:8080/api/user/delete", {
      email,
      movieId,
    });
    // I was faced to much issue when trying to delete movies from list,Then later is notice that is didnot return the movies array
    return movies;
  }
);

export const fetchDataByGenre = createAsyncThunk(
  "/netflix/moviesByGenre",
  ({ genre, type }, thunkApi) => {
    const {
      netflix: { genres },
    } = thunkApi.getState();
    return getRawData(
      `${TMDB_BASE_URL}/discover/${type}?api_key=${API_KEY}&with_genres=${genre}`,
      genres
    );
  }
);
// 'https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc'

// Reducers
const NetflixSlice = createSlice({
  name: "Netflix",
  initialState,
  extraReducers: (builder) => {
    builder.addCase(getGenres.fulfilled, (state, action) => {
      state.genres = action.payload;
      state.genresLoaded = true;
    });
    builder.addCase(fetchMovies.fulfilled, (state, action) => {
      state.movies = action.payload;
    });
    builder.addCase(fetchDataByGenre.fulfilled, (state, action) => {
      state.movies = action.payload;
    });
    builder.addCase(fetchLikedMovies.fulfilled, (state, action) => {
      state.movies = action.payload;
    });
    builder.addCase(removeFromLikedMovies.fulfilled, (state, action) => {
      state.movies = action.payload;
    });
  },
});

// Store
export const store = configureStore({
  reducer: {
    netflix: NetflixSlice.reducer,
  },
});
