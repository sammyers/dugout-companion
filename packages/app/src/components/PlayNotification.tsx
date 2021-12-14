import React, { FC, useEffect, useRef, useState } from 'react';
import { Card, Layer, ThemeContext } from 'grommet';

import Play from './plays/Play';

import { getLastPlay } from 'state/plays/selectors';
import { useAppSelector } from 'utils/hooks';

const PlayNotification: FC<{ target: HTMLElement }> = ({ target }) => {
  const lastPlay = useAppSelector(getLastPlay);

  const [showNotification, setShowNotification] = useState(false);
  const timeoutId = useRef(-1);

  useEffect(() => {
    if (lastPlay?.description) {
      setShowNotification(true);
      clearTimeout(timeoutId.current);
      timeoutId.current = window.setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastPlay?.description, setShowNotification]);

  return (
    <>
      {lastPlay && showNotification && (
        <Layer
          plain
          position="bottom-left"
          modal={false}
          target={target}
          margin={{ bottom: 'medium', left: 'medium' }}
        >
          <ThemeContext.Extend value={{ global: { size: { medium: '324px' } } }}>
            <Card background="light-1" pad="small" width="medium">
              <Play {...lastPlay!} />
            </Card>
          </ThemeContext.Extend>
        </Layer>
      )}
    </>
  );
};

export default PlayNotification;
