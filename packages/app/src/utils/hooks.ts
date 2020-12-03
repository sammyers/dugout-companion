import { useEffect, EffectCallback } from 'react';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

import { AppState, AppDispatch } from 'state/store';

// eslint-disable-next-line
export const useMount = (effect: EffectCallback) => useEffect(effect, []);

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector;
