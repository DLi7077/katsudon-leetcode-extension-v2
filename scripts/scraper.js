// user clicks button
// expect loadingStyle
// when gone, look for fail or success
//   fail: some error exists
//   success: some time space text will show up

console.log("Loaded");
const Utils = {
  get: (object, path) => {
    const chainedKeys = path.split(".");
    let result = object;
    for (const key of chainedKeys) {
      if (!result[key]) {
        console.log(`invalid key ${key}`);
        return null;
      }
      result = result[key];
    }

    return result;
  },
};

const classes = {
  sumbitButton:
    "px-3 py-1.5 font-medium items-center whitespace-nowrap transition-all focus:outline-none inline-flex text-label-r bg-green-s dark:bg-dark-green-s hover:bg-green-3 dark:hover:bg-dark-green-3 rounded-lg",
  loadingRect: "animate-pulse flex w-full flex-col space-y-4",
};

const constants = {
  scriptData: () => {
    return Utils.get(
      JSON.parse(document.getElementById("__NEXT_DATA__").innerText),
      "props.pageProps.dehydratedState.queries"
    );
  },
  problemInfo: () => {
    const problemInfoIdx = 0;

    const problem = Utils.get(
      constants.scriptData()[problemInfoIdx],
      "state.data.question"
    );
    return {
      id: problem.questionFrontendId,
      title: problem.title,
      title_slug: problem.titleSlug,
      difficulty: problem.difficulty,
      premium: problem.isPaidOnly,
    };
  },
  starterCode: (language) => {
    const startingCodeIdx = 2;
  },
};

function validateSubmit(targetElement) {
  return targetElement.innerText === "Submit";
}

/**
 * @description Waits for leetcode to process the solution and calls the scraper after
 * @param {void} scrapeFunction The next function to call - the scraper
 * @returns nothing
 */
let awaitSubmissionInterval = null; // global submission status
async function awaitSubmission(scrapeFunction) {
  if (!!awaitSubmissionInterval) {
    console.warn("Katsudon: already submitting");
    return;
  }
  const intervalTick = 300; //ms
  const isLoading = () => {
    return !!document.getElementsByClassName(classes.loadingRect).length;
  };

  if (!awaitSubmissionInterval) {
    // wait for leetcode to process the solution (loading rectangles)
    awaitSubmissionInterval = setInterval(() => {
      if (!isLoading()) {
        clearInterval(awaitSubmissionInterval);
        awaitSubmissionInterval = null;
        scrapeFunction();
      }
    }, intervalTick);
  }
}

function retrieveSolutionFromLocalStorage(problemId, solutionLanguage) {
  const localStorageKeys = Object.keys(localStorage);
  const solutionRegex = new RegExp(`^${problemId}.+${solutionLanguage}$`);
  console.log(solutionRegex);

  // https://stackoverflow.com/a/43825436
  const solutionKey = localStorageKeys.find((key) => solutionRegex.test(key));
  return localStorage.getItem(solutionKey);
}

function scrapeSubmisison() {
  const problemId = Utils.get(constants.problemInfo(), "id");
  const solutionBlockLanguage = document
    .querySelector("[data-mode-id]")
    .getAttribute("data-mode-id");

  // retrieve code submission from localStorage
  const solution = retrieveSolutionFromLocalStorage(
    problemId,
    solutionBlockLanguage
  );

  console.log(solution);
  console.log(solutionBlockLanguage);
  return solution;
}

async function submissionLifeCycle(e) {
  if (!validateSubmit(e.target)) {
    console.log("not submit button");
    return;
  }
  await awaitSubmission(scrapeSubmisison);
}

document.addEventListener("click", submissionLifeCycle);
