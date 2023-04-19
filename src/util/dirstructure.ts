import * as path from "path";

/**
 * A path referring to a file in a repository, either in a local checkout or in
 * a remote repository.
 */
export abstract class Path {
  constructor(
    /**
     * The relative path of the file, i.e., the path relative to the root of the
     * repository.
     */
    public readonly relativePath: string
  ) {}

  /**
   * Create a new path of the same type as this path, but with a different
   * relative path.
   */
  abstract makeSimilar(relativePath: string): Path;

  /**
   * Return the directory name of the relative path, i.e., the path without the
   * last component.
   */
  dirname(): string {
    return path.dirname(this.relativePath);
  }

  /**
   * Return the base name of the relative path, i.e., the last component of the
   * path.
   */
  basename(): string {
    return path.basename(this.relativePath);
  }

  /**
   * Return the extension of the relative path, i.e., the part of the last
   * component from the last dot, or the empty string if there is no dot
   * (except possibly the first character).
   */
  extname(): string {
    return path.extname(this.relativePath);
  }

  toString(): string {
    return this.relativePath;
  }
}

/**
 * A path referring to a file in a local repository checkout, specified by the
 * root directory and a relative path.
 */
export class LocalPath extends Path {
  constructor(public readonly root: string, relativePath: string) {
    super(relativePath);
  }

  makeSimilar(relativePath: string): LocalPath {
    return new LocalPath(this.root, relativePath);
  }

  absolutePath(): string {
    return path.join(this.root, this.relativePath);
  }
}

/**
 * A path referring to a file in a remote repository, specified by the
 * repository name and a relative path.
 */
export class RemotePath extends Path {
  constructor(public readonly repo: { owner: string; name: string }, relativePath: string) {
    super(relativePath);
  }

  makeSimilar(relativePath: string): RemotePath {
    return new RemotePath(this.repo, relativePath);
  }
}

/**
 * Options for finding related files.
 */
export type RelatedFilesOptions = {
  /**
   * List of keywords to identify relevant cousins.
   *
   * A file `c` is considered a cousin of `f` if their paths share a common root
   * (https://xkcd.com/2608/). If the next path component of `c` after the root
   * contains one of the keywords, `c` is considered a relevant cousin of `f`.
   */
  cousinKeywords: string[];
  /** Maximum number of files to return. */
  maxFiles: number;
  basePriorities: {
    /** Priority for files in the same folder as `f`. */
    sameFolder: number;
    /** Priority for files in the parent folder of `f`. */
    parentFolder: number;
    /** Priority for files in a subfolder of `f`. */
    childFolder: number;
    /** Priority for files in a cousin folder of `f`. */
    cousinFolder: number;
  };
  /** A callback to adjust the priority of a file. */
  adjustPriority: (file: string, priority: number) => number;
};

/**
 * Default options for finding related files.
 */
export const DEFAULT_OPTIONS: RelatedFilesOptions = {
  cousinKeywords: ["test"],
  maxFiles: Number.MAX_SAFE_INTEGER,
  basePriorities: {
    sameFolder: 1,
    parentFolder: 0.9,
    childFolder: 0.8,
    cousinFolder: 0.7,
  },
  adjustPriority: (file: string, priority: number) => {
    // up-weight test files
    if (file.includes("test")) {
      return 1 - (1 - priority) / 2;
    } else {
      return priority;
    }
  },
};
