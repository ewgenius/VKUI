import { FC, HTMLAttributes, useMemo, useRef, useState } from 'react';
import { useDOM } from '../../lib/dom';
import { classNames } from '../../lib/classNames';
import { AppRootContext } from './AppRootContext';
import { withAdaptivity, SizeType, AdaptivityProps } from '../../hoc/withAdaptivity';
import { useIsomorphicLayoutEffect } from '../../lib/useIsomorphicLayoutEffect';
import { classScopingMode } from '../../lib/classScopingMode';
import { IconSettingsProvider } from '@vkontakte/icons';
import { elementScrollController, globalScrollController, ScrollContext, ScrollContextInterface } from './ScrollContext';
import { noop } from '../../lib/utils';
import { warnOnce } from '../../lib/warnOnce';

// Используйте classList, но будьте осторожны
/* eslint-disable no-restricted-properties */

export interface AppRootProps extends HTMLAttributes<HTMLDivElement>, AdaptivityProps {
  /** @deprecated Use mode="embedded" */
  embedded?: boolean;
  /** Режим встраивания */
  mode?: 'partial' | 'embedded' | 'full';
  window?: Window;
  /** Убирает классы без префикса (.Button) */
  noLegacyClasses?: boolean;
  scroll?: 'global' | 'contain';
}

const warn = warnOnce('AppRoot');
const AppRoot: FC<AppRootProps> = ({
  children, mode: _mode, embedded: _embedded, sizeX, hasMouse, noLegacyClasses = false, scroll = 'global',
  ...props
}) => {
  // normalize mode
  const mode = _mode || (_embedded ? 'embedded' : 'full');

  const rootRef = useRef<HTMLDivElement>();
  const [portalRoot, setPortalRoot] = useState<HTMLDivElement>(null);
  const { window, document } = useDOM();

  const initialized = useRef(false);
  if (!initialized.current) {
    if (window && mode === 'full') {
      document.documentElement.classList.add('vkui');
    }
    classScopingMode.noConflict = noLegacyClasses;
    initialized.current = true;
  }

  if (process.env.NODE_ENV === 'development') {
    if (scroll !== 'global' && mode !== 'embedded') {
      warn('Scroll modes only supported in embedded mode');
    }
    if (_mode && _embedded) {
      warn(`mode="${mode}" overrides embedded`);
    }
  }

  // setup portal
  useIsomorphicLayoutEffect(() => {
    if (mode === 'full') {
      return noop;
    }

    const portal = document.createElement('div');
    portal.classList.add('vkui__portal-root');
    document.body.appendChild(portal);
    setPortalRoot(portal);
    return () => portal.parentElement.removeChild(portal);
  }, []);

  // setup root classes
  useIsomorphicLayoutEffect(() => {
    if (mode === 'partial') {
      return noop;
    }

    const parent = rootRef.current.parentElement;
    const classes = ['vkui__root'].concat(mode === 'embedded' ? 'vkui__root--embedded' : []);
    parent.classList.add(...classes);

    return () => {
      parent.classList.remove(...classes);
      if (mode === 'full') {
        document.documentElement.classList.remove('vkui');
      }
    };
  }, []);

  // adaptivity handler
  useIsomorphicLayoutEffect(() => {
    if (mode === 'partial' || sizeX !== SizeType.REGULAR) {
      return noop;
    }
    const container = mode === 'embedded' ? rootRef.current.parentElement : document.body;
    container.classList.add('vkui--sizeX-regular');
    return () => container.classList.remove('vkui--sizeX-regular');
  }, [sizeX]);

  const scrollController = useMemo<ScrollContextInterface>(
    () => scroll === 'contain' ? elementScrollController(rootRef) : globalScrollController(window, document),
    [scroll]);

  const content = (
    <AppRootContext.Provider value={{
      appRoot: rootRef,
      portalRoot: portalRoot,
      embedded: mode === 'embedded',
    }}>
      <ScrollContext.Provider value={scrollController}>
        <IconSettingsProvider classPrefix="vkui" globalClasses={!noLegacyClasses}>
          {children}
        </IconSettingsProvider>
      </ScrollContext.Provider>
    </AppRootContext.Provider>
  );

  return mode === 'partial' ? content : (
    <div ref={rootRef} vkuiClass={classNames('AppRoot', {
      'AppRoot--no-mouse': !hasMouse,
    })} {...props}>
      {content}
    </div>
  );
};

export default withAdaptivity(AppRoot, {
  sizeX: true,
  hasMouse: true,
});
