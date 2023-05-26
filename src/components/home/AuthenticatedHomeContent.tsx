import classNames from 'classnames';
import { useCallback, useEffect, useState, type ChangeEvent, type FC } from 'react';

let dragCounter = 0;

const AuthenticatedHomeContent: FC = () => {
  const [file, setFile] = useState<File | undefined>(undefined);
  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  }, []);

  const [dragging, setDragging] = useState(false);
  const handleDragEnter = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    dragCounter++;

    if (typeof event?.dataTransfer?.items !== 'undefined' && event.dataTransfer.items.length > 0) {
      setDragging(true);
    }
  }, []);
  const handleDragLeave = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    dragCounter--;

    if (dragCounter === 0) {
      setDragging(false);
    }
  }, []);
  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);
  const handleDrop = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (typeof event?.dataTransfer?.files !== 'undefined' && event.dataTransfer.files.length > 0) {
      setFile(event.dataTransfer.files[0]);
      setDragging(false);
    }
  }, []);
  useEffect(() => {
    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  return (
    <>
      <div className="flex w-11/12 items-center justify-center md:w-9/12 lg:w-7/12 xl:w-5/12">
        <label
          htmlFor="dropzone-file"
          className={classNames(
            'dark:hover:bg-bray-800 flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600',
            {
              'border-purple-600 bg-purple-100': dragging,
              'border-gray-300 bg-gray-50': !dragging,
            },
          )}
        >
          <div className="flex flex-col items-center justify-center pb-6 pt-5 text-center">
            {!dragging && (
              <>
                <svg
                  aria-hidden="true"
                  className="mb-3 h-10 w-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  ></path>
                </svg>
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click în această zonă pentru a încărca</span> sau trage fișierul aici (drag and drop)
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Orice extensie este acceptată.</p>
                {file && (
                  <p className="text-md mt-12 text-gray-500 dark:text-gray-400">
                    <small>Fișierul selectat: </small>
                    <span className="font-semibold">{file.name}</span> <small>({file.size} B)</small>
                  </p>
                )}
              </>
            )}
            {dragging && <h1 className="font-bold">Dă drumul fișierului pentru a îl încărca!</h1>}
          </div>
          <input
            id="dropzone-file"
            type="file"
            className="hidden"
            onChange={handleFileChange}
            multiple={false}
          />
        </label>
      </div>
    </>
  );
};

export default AuthenticatedHomeContent;
