import { faSatelliteDish } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import Link from 'next/link';
import { useCallback, useEffect, useState, type ChangeEvent, type FC } from 'react';
import Particles from 'react-particles';
import { api } from '~/utils/api';
import { maxFileSizeInBytes } from '~/utils/constants';
import { encrypt } from '~/utils/helpers/encryption';
import { getFormattedFileSize } from '~/utils/helpers/file';
import { useAppError } from '~/utils/hooks/useAppError';
import { useParticlesInit } from '~/utils/hooks/useParticlesInit';
import LoadingSpinner from '../shared/LoadingSpinner';

let dragCounter = 0;

const AuthenticatedHomeContent: FC = () => {
  const [file, setFile] = useState<File | undefined>(undefined);
  const [receiverIdentifier, setReceiverIdentifier] = useState('');
  const {
    mutate: shareFile,
    error: shareFileError,
    isError: isShareFileError,
    data: shareFileData,
    isSuccess: isShareFileSuccess,
    isLoading: isShareFileLoading,
    reset: resetShareFile,
  } = api.file.shareFile.useMutation();
  const { processedError: processedReceiverError } = useAppError({ error: shareFileError });
  const [receiverError, setReceiverError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [displaySuccessMessage, setDisplaySuccessMessage] = useState(false);
  const handleReceiverChange = (event: ChangeEvent<HTMLInputElement>) => {
    setReceiverError('');
    setReceiverIdentifier(event.target.value);
  };
  const [fileError, setFileError] = useState('');
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    const { files } = event.target;
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  };

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
    setFileError('');

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

  const handleSendButtonClick = () => {
    setReceiverError('');
    setFileError('');
    setGeneralError('');

    if (!file) {
      setFileError('Nu este selectat niciun fișier.');
      return;
    }
    if (file.size > maxFileSizeInBytes) {
      setFileError(`Fișierul depășește limita de ${getFormattedFileSize(maxFileSizeInBytes)}.`);
      return;
    }

    shareFile({
      receiverIdentifier,
      fileName: file.name,
      fileType: file.type,
    });
  };

  useEffect(() => {
    if (isShareFileError) {
      setReceiverError(processedReceiverError);
      return;
    }

    if (!isShareFileSuccess) {
      return;
    }

    if (!shareFileData || !file) {
      setGeneralError('A intervenit o eroare. Te rugăm să reîncerci.');
      return;
    }

    const { symmetricKey, presignedPost } = shareFileData;

    const render = new FileReader();
    render.onload = async (event) => {
      const result = event.target?.result;
      if (!result) {
        setGeneralError('A intervenit o eroare. Te rugăm să reîncerci.');
        return;
      }

      let resultBuffer: Buffer | null = null;
      if (typeof result === 'string') {
        resultBuffer = Buffer.from(result);
      } else {
        resultBuffer = Buffer.from(new Uint8Array(result));
      }
      const { encryptedBuffer: encryptedResultBuffer } = encrypt(resultBuffer, symmetricKey);
      const encryptedBlob = new Blob([encryptedResultBuffer], {
        type: file.type,
      });

      const formData = new FormData();
      Object.entries({ ...presignedPost.fields, file: encryptedBlob }).forEach(([key, value]) => {
        formData.append(key, value);
      });

      try {
        const uploadResult = await fetch(presignedPost.url, {
          method: 'POST',
          body: formData,
        });
        if (uploadResult.ok) {
          setDisplaySuccessMessage(true);
        } else {
          setGeneralError('A intervenit o eroare. Te rugăm să reîncerci.');
          console.error(await uploadResult.text());
        }
      } catch (_) {
        setGeneralError('A intervenit o eroare. Te rugăm să reîncerci.');
      }
    };

    render.readAsArrayBuffer(file);
  }, [file, isShareFileError, isShareFileSuccess, processedReceiverError, shareFileData]);

  useEffect(() => {
    if (!displaySuccessMessage) {
      return;
    }
    resetShareFile();

    setReceiverIdentifier('');
    setFile(undefined);
    setReceiverError('');
    setFileError('');
    setGeneralError('');
  }, [displaySuccessMessage, resetShareFile]);

  return (
    <div className="flex w-11/12 flex-col items-center justify-center md:w-9/12 lg:w-7/12 xl:w-5/12">
      {displaySuccessMessage ? (
        <>
          <FileSharedSuccessfullyParticles />
          <div className="z-20">
            <h1 className="mb-6 text-3xl font-bold text-green-500">Fișierul a fost partajat cu succes!</h1>
          </div>
          <div className="flex items-center justify-center gap-6">
            <button
              type="button"
              className="inline-flex rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 p-0.5 text-center text-sm font-medium text-slate-50 shadow-lg shadow-purple-500/50 hover:bg-gradient-to-br focus:outline-none focus:ring-4 focus:ring-purple-300 dark:shadow-lg dark:shadow-purple-800/80 dark:focus:ring-purple-800"
              onClick={() => {
                setDisplaySuccessMessage(false);
              }}
            >
              <span className="px-5 py-2.5">Partajează altul</span>
            </button>
            <Link
              className="inline-flex rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 p-0.5 text-center text-sm font-medium text-slate-50 shadow-lg shadow-purple-500/50 hover:bg-gradient-to-br focus:outline-none focus:ring-4 focus:ring-purple-300 dark:shadow-lg dark:shadow-purple-800/80 dark:focus:ring-purple-800"
              href="/fisiere/"
            >
              <span className="px-5 py-2.5">Vezi fișierele tale</span>
            </Link>
          </div>
        </>
      ) : (
        <>
          <label
            htmlFor="input-group-receiver"
            className="block text-center text-sm font-medium text-gray-900 dark:text-white"
          >
            Identificator destinatar
          </label>
          <div className="relative mt-1 w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-20 flex items-center pl-3">
              <FontAwesomeIcon icon={faSatelliteDish} />
            </div>
            <input
              type="text"
              value={receiverIdentifier}
              id="input-group-receiver"
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-purple-600 focus:ring-0 focus:ring-purple-600 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              placeholder="Cheie publică de 130 de caractere sau o adresă de email validă..."
              onChange={handleReceiverChange}
            />
          </div>
          <div className="z-10 mt-1 bg-gradient-to-br from-red-800 to-red-500 bg-clip-text text-sm font-bold text-transparent">{receiverError}</div>
          <label
            htmlFor="dropzone-file"
            className="mt-3 block text-center text-sm font-medium text-gray-900 dark:text-white"
          >
            Fișier
          </label>
          <label
            htmlFor="dropzone-file"
            className={classNames(
              'dark:hover:bg-bray-800 mt-1 flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600',
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
                      <span className="font-semibold">{file.name}</span> <small>({getFormattedFileSize(file.size)})</small>
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
          <div className="z-10 mt-1 bg-gradient-to-br from-red-800 to-red-500 bg-clip-text text-sm font-bold text-transparent">{fileError}</div>

          <button
            onClick={handleSendButtonClick}
            className={classNames(
              'group relative mt-3 inline-flex items-center justify-center overflow-hidden rounded-lg p-0.5 text-sm font-medium text-gray-900 hover:text-slate-50 focus:outline-none focus:ring-4 focus:ring-purple-300 group-hover:from-purple-600 group-hover:to-blue-500 dark:text-slate-50 dark:focus:ring-blue-800',
              {
                'is-loading bg-slate-100': isShareFileLoading,
                'bg-gradient-to-br from-purple-600 to-blue-500': !isShareFileLoading,
              },
            )}
          >
            {(isShareFileLoading || isShareFileSuccess) && <LoadingSpinner />}
            <span className="relative rounded-md bg-slate-50 px-5 py-2.5 transition-all duration-75 ease-in group-hover:bg-opacity-0 dark:bg-gray-900">
              Partajează
            </span>
          </button>
          <div className="z-10 mt-1 bg-gradient-to-br from-red-800 to-red-500 bg-clip-text text-sm font-bold text-transparent">{generalError}</div>
        </>
      )}
    </div>
  );
};

const FileSharedSuccessfullyParticles: FC = () => {
  const { particlesInit: successParticlesInit } = useParticlesInit();

  return (
    <Particles
      id="file-shared-successfully-particles"
      init={successParticlesInit}
      canvasClassName="z-10"
      options={{
        fpsLimit: 100,
        particles: {
          number: {
            value: 0,
          },
          color: {
            value: ['#00FFFC', '#FC00FF', '#fffc00'],
          },
          shape: {
            type: ['circle', 'square'],
          },
          opacity: {
            value: 1,
            animation: {
              enable: true,
              minimumValue: 0,
              speed: 2,
              startValue: 'max',
              destroy: 'min',
            },
          },
          size: {
            value: 7,
            random: {
              enable: true,
              minimumValue: 3,
            },
          },
          links: {
            enable: false,
          },
          life: {
            duration: {
              sync: true,
              value: 5,
            },
            count: 1,
          },
          move: {
            enable: true,
            gravity: {
              enable: true,
              acceleration: 20,
            },
            speed: { min: 5, max: 20 },
            decay: 0.1,
            direction: 'none',
            straight: false,
            outModes: {
              default: 'destroy',
              top: 'none',
            },
          },
          rotate: {
            value: {
              min: 0,
              max: 360,
            },
            direction: 'random',
            move: true,
            animation: {
              enable: true,
              speed: 30,
            },
          },
          tilt: {
            direction: 'random',
            enable: true,
            move: true,
            value: {
              min: 0,
              max: 360,
            },
            animation: {
              enable: true,
              speed: 30,
            },
          },
          roll: {
            darken: {
              enable: true,
              value: 25,
            },
            enable: true,
            speed: {
              min: 15,
              max: 25,
            },
          },
          wobble: {
            distance: 30,
            enable: true,
            move: true,
            speed: {
              min: -15,
              max: 15,
            },
          },
        },
        interactivity: {
          detectsOn: 'window',
          events: {
            resize: true,
          },
        },
        detectRetina: true,
        emitters: {
          direction: 'none',
          life: {
            count: 0,
            duration: 0.1,
            delay: 0.4,
          },
          rate: {
            delay: 0.25,
            quantity: 75,
          },
          size: {
            width: 0,
            height: 0,
          },
        },
      }}
    />
  );
};

export default AuthenticatedHomeContent;
