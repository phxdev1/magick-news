/// <reference types="astro/client" />
/// <reference types="@astrojs/cloudflare" />

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
	interface Locals extends Runtime {}
}

declare module 'astro:content' {
	interface Render {
		'.md': Promise<{
			Content: import('astro').MarkdownInstance<{}>['Content'];
			headings: import('astro').MarkdownHeading[];
			remarkPluginFrontmatter: Record<string, any>;
		}>;
	}
}

declare module 'astro:content' {
	export interface CollectionEntry<C> {
		data: C extends "news" ? {
			title: string;
			subtitle?: string;
			author: string;
			read_time: string;
			publish_date: Date;
			created_date: Date;
			heroImage?: string;
			description?: string;
		} : never;
	}

	export type CollectionConfig = {
		news: any;
	}
}
