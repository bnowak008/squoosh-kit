export type AmbientBlobConfig = {
  id: number;
  size: number;
  top: string;
  left: string;
  opacity: number;
  duration: string;
  delay: string;
};

export type HeroBlobLayer = {
  size: number;
  opacity: number;
  morph: string;
  duration: string;
  delay: string;
  blur: number;
  depth: number;
};

export type BlobFieldProps = {
  isDragging: boolean;
  editorVisible: boolean;
};
