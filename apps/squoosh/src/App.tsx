import { useReducer } from 'react';
import type { Dispatch } from 'react';
import type { AppState, Action, CodecId } from './types';
import { getCodec, CODECS } from './codec/registry';
import LandingPage from './components/LandingPage';
import Editor from './components/Editor';

const initialState: AppState = {
  phase: 'landing',
  sourceFile: null,
  imageInput: null,
  sourceObjectUrl: null,
  codecId: 'webp',
  codecOptions: CODECS[0].defaultOptions,
  encodeResult: null,
  encodeError: null,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_FILE': {
      if (state.sourceObjectUrl) URL.revokeObjectURL(state.sourceObjectUrl);
      if (state.encodeResult?.objectUrl)
        URL.revokeObjectURL(state.encodeResult.objectUrl);
      return {
        ...state,
        phase: 'decoding',
        sourceFile: action.file,
        imageInput: null,
        sourceObjectUrl: null,
        encodeResult: null,
        encodeError: null,
      };
    }
    case 'DECODE_SUCCESS':
      return {
        ...state,
        phase: 'encoding',
        imageInput: action.imageInput,
        sourceObjectUrl: action.objectUrl,
      };
    case 'DECODE_ERROR':
      return {
        ...state,
        phase: 'landing',
        encodeError: action.error,
      };
    case 'SET_CODEC': {
      if (state.encodeResult?.objectUrl)
        URL.revokeObjectURL(state.encodeResult.objectUrl);
      return {
        ...state,
        codecId: action.codecId,
        codecOptions: action.defaultOptions,
        encodeResult: null,
        encodeError: null,
      };
    }
    case 'SET_OPTIONS':
      return {
        ...state,
        codecOptions: { ...state.codecOptions, ...action.options },
      };
    case 'ENCODE_START':
      return { ...state, phase: 'encoding', encodeError: null };
    case 'ENCODE_SUCCESS': {
      if (state.encodeResult?.objectUrl)
        URL.revokeObjectURL(state.encodeResult.objectUrl);
      return {
        ...state,
        phase: 'editor',
        encodeResult: {
          bytes: action.bytes,
          objectUrl: action.objectUrl,
          sizeBytes: action.bytes.length,
        },
        encodeError: null,
      };
    }
    case 'ENCODE_ERROR':
      return {
        ...state,
        phase: state.imageInput ? 'editor' : 'landing',
        encodeError: action.error,
      };
    case 'RESET': {
      if (state.sourceObjectUrl) URL.revokeObjectURL(state.sourceObjectUrl);
      if (state.encodeResult?.objectUrl)
        URL.revokeObjectURL(state.encodeResult.objectUrl);
      return { ...initialState };
    }
  }
}

export type AppDispatch = Dispatch<Action>;

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  function handleSetCodec(codecId: CodecId) {
    const codec = getCodec(codecId);
    dispatch({ type: 'SET_CODEC', codecId, defaultOptions: codec.defaultOptions });
  }

  if (state.phase === 'landing' || state.phase === 'decoding') {
    return (
      <LandingPage
        isDecoding={state.phase === 'decoding'}
        error={state.encodeError}
        dispatch={dispatch}
      />
    );
  }

  return (
    <Editor
      state={state}
      dispatch={dispatch}
      onSetCodec={handleSetCodec}
    />
  );
}
