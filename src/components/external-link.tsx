/**
 * CECUREUS — Safe External Hyperlink & In-App Browser Component
 *
 * Why this file was created:
 * This component provides secure, platform-adaptive external link navigation.
 * On native mobile (iOS/Android), it launches links in a sandboxed in-app browser (`expo-web-browser`)
 * to keep users inside the app experience, while on web it renders standard `<a target="_blank">` tags.
 */

import { Href, Link } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { type ComponentProps } from 'react';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: Href & string };

export function ExternalLink({ href, ...rest }: Props) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={async (event) => {
        if (process.env.EXPO_OS !== 'web') {
          // Prevent the default behavior of linking to the default browser on native.
          event.preventDefault();
          // Open the link in an in-app browser.
          await openBrowserAsync(href, {
            presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
          });
        }
      }}
    />
  );
}
