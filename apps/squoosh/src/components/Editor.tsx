import type { Dispatch } from 'react';
import type { AppState, Action, CodecId } from '../types';
import { useImageDecode } from '../hooks/useImageDecode';
import { useEncoder } from '../hooks/useEncoder';
import SplitView from './SplitView';
import BottomPanel from './BottomPanel';

type Props = {
  state: AppState;
  dispatch: Dispatch<Action>;
  onSetCodec: (codecId: CodecId) => void;
};

export default function Editor({ state, dispatch, onSetCodec }: Props) {
  useImageDecode(state.sourceFile, dispatch);
  useEncoder(state.imageInput, state.codecId, state.codecOptions, dispatch);

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      <div className="flex-1 overflow-hidden">
        <SplitView
          sourceObjectUrl={state.sourceObjectUrl}
          encodeResult={state.encodeResult}
          codecId={state.codecId}
          isEncoding={state.phase === 'encoding'}
        />
      </div>
      <BottomPanel
        state={state}
        dispatch={dispatch}
        onSetCodec={onSetCodec}
      />
    </div>
  );
}
