/**
 * Brand logos for 3D graph nodes.
 *
 * Nodes whose label names a technology render that technology's logo instead of the generic
 * coloured ball. The icons come from react-icons' Simple Icons set, are rasterised once per
 * (logo, theme) into a THREE texture, and are cached for the lifetime of the page — a node object
 * can be rebuilt many times (search, filter, size/colour toggles) and must never pay to re-render
 * an SVG it has already drawn.
 *
 * Labels that name no known technology (sections, projects, pages) return null and keep the ball.
 */

import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {IconType} from 'react-icons';
import * as THREE from 'three';
import {
  SiJavascript, SiTypescript, SiReact, SiNextdotjs, SiRemix, SiRedux, SiMobx, SiReactquery, SiZod,
  SiTailwindcss, SiAntdesign, SiSass, SiBootstrap,
  SiNodedotjs, SiExpress, SiNestjs, SiGraphql,
  SiMongodb, SiPostgresql, SiFirebase, SiSupabase,
  SiGithub, SiGithubactions, SiJira, SiLinear, SiGit,
} from 'react-icons/si';

interface ILogoSpec {
  Icon: IconType;
  color: string;
  // Brand colours that are white/near-white vanish on the light canvas, so those icons carry a
  // darker stand-in used only in the light theme (same treatment as the tech-icon rack).
  lightColor?: string;
}

// Keyed by the node's label, lower-cased. Several labels group two tools ("Git & GitHub",
// "Jira / Linear"); those take the logo of the first one named.
const NODE_LOGOS: Record<string, ILogoSpec> = {
  'javascript': {Icon: SiJavascript, color: '#F7DF1E'},
  'typescript': {Icon: SiTypescript, color: '#3178C6'},
  'react': {Icon: SiReact, color: '#61DAFB'},
  'next.js': {Icon: SiNextdotjs, color: '#FFFFFF', lightColor: '#111111'},
  'remix': {Icon: SiRemix, color: '#FFFFFF', lightColor: '#111111'},
  'redux': {Icon: SiRedux, color: '#764ABC'},
  'mobx': {Icon: SiMobx, color: '#FF9955'},
  'react query': {Icon: SiReactquery, color: '#FF4154'},
  'zod': {Icon: SiZod, color: '#3E67B1'},
  'tailwind': {Icon: SiTailwindcss, color: '#38BDF8'},
  'ant design': {Icon: SiAntdesign, color: '#1890FF'},
  'scss': {Icon: SiSass, color: '#CD6799'},
  'bootstrap': {Icon: SiBootstrap, color: '#7952B3'},
  'node.js': {Icon: SiNodedotjs, color: '#4CAF50'},
  'express': {Icon: SiExpress, color: '#FFFFFF', lightColor: '#111111'},
  'nestjs': {Icon: SiNestjs, color: '#E0234E'},
  'rest / graphql': {Icon: SiGraphql, color: '#E10098'},
  'graphql': {Icon: SiGraphql, color: '#E10098'},
  'mongodb': {Icon: SiMongodb, color: '#47A248'},
  'postgresql': {Icon: SiPostgresql, color: '#4169E1'},
  'firebase': {Icon: SiFirebase, color: '#FFCA28'},
  'supabase': {Icon: SiSupabase, color: '#3ECF8E'},
  'git & github': {Icon: SiGithub, color: '#FFFFFF', lightColor: '#111111'},
  'github': {Icon: SiGithub, color: '#FFFFFF', lightColor: '#111111'},
  'git': {Icon: SiGit, color: '#F05032'},
  'ci/cd': {Icon: SiGithubactions, color: '#2088FF'},
  'jira / linear': {Icon: SiJira, color: '#0052CC'},
  'jira': {Icon: SiJira, color: '#0052CC'},
  'linear': {Icon: SiLinear, color: '#5E6AD2'},
};

// Rasterisation size. Sprites are drawn at a few dozen screen px at most, but the camera can fly
// right up to a node, so render at a comfortable multiple of that and let mipmapping handle the
// rest. Powers of two keep WebGL happy on every driver.
const LOGO_TEXTURE_SIZE = 128;

const textureCache = new Map<string, THREE.Texture>();

/**
 * Normalises a node label into a NODE_LOGOS key.
 * @param {string} [name] - the node's display name
 * @return {string} the lookup key
 */
const toLogoKey = (name?: string): string => (name ?? '').trim().toLowerCase();

/**
 * Whether a node label has a logo at all — lets callers skip the texture work entirely.
 * @param {string} [name] - the node's display name
 * @return {boolean} true when a logo exists for this label
 */
export const hasNodeLogo = (name?: string): boolean => toLogoKey(name) in NODE_LOGOS;

/**
 * The texture for a node label's logo, rasterised on first use and cached per (label, theme).
 * Returns null for labels with no known logo, so the caller can fall back to the default node body.
 *
 * The texture is returned before its image has necessarily decoded — three fills it in on load and
 * the renderer is running continuously, so the logo simply appears a frame or two later.
 * @param {string} [name] - the node's display name
 * @param {boolean} [isLight] - true when the light theme is active
 * @return {THREE.Texture | null} the logo texture, or null when the label has no logo
 */
export const getNodeLogoTexture = (name?: string, isLight = false): THREE.Texture | null => {
  const key = toLogoKey(name);
  const spec = NODE_LOGOS[key];
  if (!spec) return null;

  const cacheKey = `${key}|${isLight ? 'light' : 'dark'}`;
  const cached = textureCache.get(cacheKey);
  if (cached) return cached;

  const color = (isLight && spec.lightColor) || spec.color;
  // react-icons renders `fill="currentColor"` and puts the `color` prop on the svg's own style, so
  // the standalone markup resolves the fill correctly without post-processing.
  const markup = renderToStaticMarkup(
    createElement(spec.Icon, {color, size: LOGO_TEXTURE_SIZE}),
  );
  const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;

  const texture = new THREE.TextureLoader().load(dataUri);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  textureCache.set(cacheKey, texture);
  return texture;
};
