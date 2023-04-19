#!/usr/bin/env bash

# Usage:
# FEATURE=describe ./test/update-baselines.sh
# FEATURE=gentest ./test/update-baselines.sh
# FEATURE=how  ./test/update-baselines.sh
# FEATURE=suggest ./test/update-baselines.sh
# FEATURE=review ./test/update-baselines.sh

HOW_ISSUES="\
    githubnext/prbot-test-express-app/issues/1  \
    githubnext/prbot-test-tensorflow-examples-small/issues/45  \
    godotengine/godot/issues/37798 \
    godotengine/godot/issues/30496 \
    WorldHealthOrganization/app/issues/1876 \
    WorldHealthOrganization/app/issues/1102 \
    grafana/grafana/issues/24059 \
    zio/zio/issues/4007 \
    psf/black/issues/2197 \
    RocketChat/Rocket.Chat.Electron/issues/2211 \
    zio/zio/issues/1399 \
    numpy/numpy/issues/8100 \
    numpy/numpy/issues/8100 \
    grafana/grafana/issues/2476 \
    andOTP/andOTP/issues/462 \
    elastic/apm-server/issues/914 \
    zio/zio/issues/1673 \
    ckeditor/ckeditor5/issues/1098 \
    RocketChat/Rocket.Chat.Electron/issues/1881 \
    openframeworks/openFrameworks/issues/404 \
    dataplat/dbatools/issues/6157 \
    mozilla/bedrock/issues/8259 \
    brave/brave-browser/issues/4588 \
    grafana/grafana/issues/22410 \
    grafana/grafana/issues/18372 \
    privacytools/privacytools.io/issues/1137 \
    rapid7/metasploit-framework/issues/13294 \
    zio/zio/issues/817 \
    processing/processing/issues/3968 \
    grafana/grafana/issues/30205 \
    UnityTechnologies/open-project-1/issues/419 \
    elastic/apm-server/issues/4880 \
    RocketChat/Rocket.Chat.Electron/issues/1825 \
    knative/docs/issues/4133 \
    psf/black/issues/1435 \
    tidyverse/dplyr/issues/2856 \
    andOTP/andOTP/issues/731 \
    hasura/graphql-engine/issues/4496 \
    dataplat/dbatools/issues/3170 \
    knative/docs/issues/4377 \
    ckeditor/ckeditor5/issues/7930 \
    gevent/gevent/issues/1318 \
    numpy/numpy/issues/6459 \
    psf/black/issues/1588 \
    phan/phan/issues/2534 \
    dataplat/dbatools/issues/3349 \
    tidyverse/dplyr/issues/5184 \
    balanced/balanced-dashboard/issues/1081 \
    NicolasHug/Surprise/issues/433 \
    grafana/grafana/issues/48388 \
    ckeditor/ckeditor5/issues/10019 \
    tidyverse/dplyr/issues/2120 \
    "

# suggest needs a total rework for boosting
SUGGEST_ISSUES="\
    githubnext/prbot-test-express-app/issues/1  \
    githubnext/prbot-test-tensorflow-examples-small/issues/45  \
    "

RANDOM_PULLS="\
    githubnext/prbot/pull/62 \
    pingcap/docs/pull/11103 \
    TUM-Dev/NavigaTUM/pull/274 \
    ibissource/iaf/pull/3966 \
    spiral/roadrunner-bridge/pull/44 \
    go-orb/orb/pull/4 \
    withastro/astro/pull/5316 \
    informalsystems/hermes/pull/2807 \
    hazelcast-guides/hazelcast-platform-operator-map-store/pull/1 \
    Qiskit/qiskit-experiments/pull/936 \
    NilPointer-Software/bdfd-wiki/pull/233 \
    JuliaSmoothOptimizers/PartitionedStructures.jl/pull/73 \
    BYU-CS-Discord/CSBot/pull/57 \
    python-discord/site/pull/794 \
    TestRunnerSRL/OoT-Randomizer/pull/1765 \
    op-ent/api/pull/18 \
    LunarVim/LunarVim/pull/3470 \
    dedis/popstellar/pull/1286 \
    near/nearcore/pull/8058 \
    nautobot/nautobot/pull/2798 \
    lacework/go-sdk/pull/1018 \
    discourse/mini_scheduler/pull/19 \
    harvester/harvester-installer/pull/381 \
    typescript-eslint/typescript-eslint/pull/5986 \
    Ultimaker/CuraEngine/pull/1575 \
    risingwavelabs/risingwave/pull/6386 \
    Clinical-Genomics/scout/pull/3664 \
    vercel/next.js/pull/42987 \
    vercel/next.js/pull/42865 \
    home-assistant/core/pull/82007 \
    grafana/grafana/pull/58591 \
    grafana/grafana/pull/58074 \
    apache/superset/pull/22064 \
    localstack/localstack/pull/7093 \
    discourse/discourse/pull/18796 \
    Kong/kong/pull/9067 \
    meilisearch/meilisearch/pull/3056 \
    metabase/metabase/pull/26462 \
    vapor/vapor/pull/2905 \
    dotnet/maui/pull/11370 \
    sourcegraph/sourcegraph/pull/44387 \
    "

PULLS_WITH_GREATER_5_ACCEPTED_CHANGES="\
    TheAlgorithms/C/pull/1138 \
    Lightning-AI/metrics/pull/1328 \
    apache/dubbo/pull/10921 \
    DataDog/datadog-agent/pull/14184 \
    rapidsai/cudf/pull/12142 \
    ovh/terraform-provider-ovh/pull/339 \
    miurahr/aqtinstall/pull/617 \
    neondatabase/neon/pull/2829 \
    unicornpkg/unicornpkg-main/pull/4 \
    OpenZeppelin/openzeppelin-nile-upgrades/pull/23 \
    github/codeql/pull/11244 \
    pyansys/pyaedt/pull/2000 \
    gekmihesg/ansible-openwrt/pull/53 \
    opentdf/tests/pull/84 \
    canonical/prometheus-k8s-operator/pull/376 \
    Jim-Hodapp-Coaching/esp32-wroom-rp/pull/45 \
    grpc-ecosystem/grpc-gateway/pull/3010 \
    aquasecurity/cloudsploit/pull/1461 \
    spacetelescope/jdaviz/pull/1835 \
    yt-project/yt/pull/4175 \
    CFPAOrg/Minecraft-Mod-Language-Package/pull/2341 \
    angular-eslint/angular-eslint/pull/1211 \
    esphome/esphome/pull/4049 \
    intel/llvm/pull/7420 \
    R2Northstar/NorthstarMods/pull/518 \
    WebAssembly/binaryen/pull/5263 \
    spacetelescope/jdaviz/pull/1850 \
    OpenNMS/opennms/pull/5473 \
    SBNSoftware/icaruscode/pull/480 \
    awslabs/aws-crt-swift/pull/87 \
    c2corg/c2c_ui/pull/2240 \
    remix-run/examples/pull/66 \
    cylc/cylc-ui/pull/1108 \
    EvoTM/EvoSC-sharp/pull/59 \
    PrairieLearn/PrairieLearn/pull/6638 \
    Yoast/wordpress-seo/pull/19167 \
    conan-io/conan-center-index/pull/14011 \
    python/cpython/pull/99548 \
    mulesoft/docs-mule-runtime/pull/2389 \
    PennyLaneAI/qml/pull/633 \
    equinor/radix-platform/pull/803 \
    hashicorp/terraform-provider-azurerm/pull/19271 \
    pyansys/pyaedt/pull/1984 \
    ytdl-org/youtube-dl/pull/31097 \
    RocketChat/Rocket.Chat/pull/26956 \
    keycloak/keycloak-ui/pull/3762 \
    elastic/apm-agent-go/pull/1347 \
    TGX-Android/Telegram-X/pull/247 \
    qmk/qmk_firmware/pull/19112 \
    nextflow-io/summit-website/pull/100 \
    mate-academy/jv-linked-list/pull/765 \
    SEKOIA-IO/intake-formats/pull/291 \
    trendmicro/cloudone-filestorage-plugins/pull/102 \
    scipy/scipy/pull/17345 \
    DLR-SC/ESID/pull/185 \
    demisto/content/pull/22316 \
    DFHack/dfhack/pull/2111 \
    ocaml/opam-repository/pull/22504 \
    openvinotoolkit/openvino/pull/13766 \
    hadley/r4ds/pull/1128 \
    mathnet/mathnet-numerics/pull/959 \
    risingwavelabs/risingwave-operator/pull/251 \
    utopia-php/framework/pull/79 \
    truecharts/charts/pull/4656 \
    percona/pmm/pull/1393 \
    FusionAuth/fusionauth-site/pull/1715 \
    arkivverket/bevaring-cli/pull/5 \
    Ensembl/ensembl-genomio/pull/25 \
    infrawatch/documentation/pull/404 \
    modelix/modelix-samples/pull/14 \
    FreshRSS/FreshRSS/pull/4651 \
    discordia-space/CEV-Eris/pull/7793 \
    mandiant/VM-Packages/pull/59 \
    space-wizards/space-station-14/pull/12615 \
    matplotlib/matplotlib/pull/24484 \
    web3-storage/w3protocol/pull/148 \
    spring-projects/spring-integration/pull/3941 \
    shapely/shapely/pull/1559 \
    dotnet/runtime/pull/78376 \
    yearn/web-lib/pull/113 \
    themesberg/flowbite-vue/pull/96 \
    pytorch/audio/pull/2848 \
    DISIC/confiture/pull/174 \
    ECP-WarpX/WarpX/pull/3482 \
    nori-dot-eco/contracts/pull/426 \
    pytroll/pyresample/pull/465 \
    uber-go/fx/pull/989 \
    ansible-collections/community.general/pull/5558 \
    kubernetes-sigs/kueue/pull/421 \
    mspass-team/mspass/pull/340 \
    zkSNACKs/WalletWasabi/pull/9534 \
    project-koku/koku/pull/3997 \
    usnistgov/pfhub/pull/1465 \
    CleverRaven/Cataclysm-DDA/pull/62274 \
    "

PULL_BODIES_WITH_SUMMARY_SECTION="\
    Gopxfs/vet-clinic-database/pull/7 \
    codefordenver/partner-finder/pull/122 \
    thomashoneyman/purescript-halogen-store/pull/15 \
    manuelkasper/mod_auth_pubtkt/pull/25 \
    LMMS/lmms/pull/776 \
    octue/example-service-cloud-run/pull/1 \
    vuejs/awesome-vue/pull/799 \
    openpay-innovations/sdk-android/pull/14 \
    joomla-framework/model/pull/7 \
    matplotlib/matplotlib/pull/21178 \
    SFDigitalServices/sfgov/pull/534 \
    tophat/sanity-runner/pull/242 \
    iFixit/react-commerce/pull/1154 \
    xmtp/xmtp-js/pull/128 \
    josephyanks/braintree_android/pull/1 \
    joomla-projects/media-manager-improvement/pull/98 \
    elijaholmos/halo-discord-bot/pull/68 \
    weltenwort/py-power-meter-monitor/pull/3 \
    benjamij/speakeasy-api/pull/9 \
    Invoca/declare_schema/pull/48 \
    hyperledger/aries-framework-javascript/pull/416 \
    dcos/dcos-cli/pull/1171 \
    cod3rs-ns/kbs-shopifine/pull/17 \
    stripe-samples/accept-a-payment/pull/587 \
    Stride-Labs/stride/pull/53 \
    sbolel/panolens.js/pull/1 \
    usgo/AGA-Ratings-Program/pull/6 \
    go-gorm/gorm/pull/4123 \
    chainguard-images/melange/pull/28 \
    swarley/discordrb/pull/3 \
    sebastian-software/edge-builder/pull/4 \
    LearnersGuild/echo/pull/830 \
    sonydevworld/spresense-nuttx/pull/175 \
    pomerium/datasource/pull/2 \
    archangel/archangel_legacy/pull/19 \
    shinjuku-mokumoku/shinjuku-mokumoku/pull/1558 \
    VictoriaFC/scream-streams/pull/12 \
    Permissionless-Software-Foundation/bch-js/pull/99 \
    Qiskit/qiskit-aer/pull/1116 \
    marshrossney/anvil/pull/11 \
    anz-bank/sysl-catalog/pull/33 \
    sjdonado/mihorario/pull/44 \
    Gopxfs/decode-morse-code-challenge/pull/1 \
    OpenNaja/cobra-tools/pull/220 \
    traveloka/terraform-datadog-dynamodb/pull/6 \
    18F/brand/pull/115 \
    jakawell/dpsplus/pull/42 \
    zio/zio-query/pull/200 \
    New-Year-New-Me/nynm_fapp/pull/11 \
    "

DESCRIBE_AND_REVIEW_PULLS="$RANDOM_PULLS $PULLS_WITH_GREATER_5_ACCEPTED_CHANGES $PULL_BODIES_WITH_SUMMARY_SECTION"

# The second group above were taken randomly from the list of PRs that
# provided by drifkin

GENTEST_PULLS="\
    NREL/rex/pull/138 \
    NanoVNA-Saver/nanovna-saver/pull/569 \
    alexmojaki/stack_data/pull/41 \
    alexmojaki/stack_data/pull/42 \
    aroberge/ideas/pull/40 \
    astanin/python-tabulate/pull/210 \
    cdt15/lingam/pull/57 \
    cdt15/lingam/pull/59 \
    con/tributors/pull/68 \
    ctera/ctera-python-sdk/pull/169 \
    jonathf/numpoly/pull/92 \
    justindujardin/pathy/pull/93 \
    make-all/tuya-local/pull/251 \
    matthewwardrop/formulaic/pull/122 \
    matthewwardrop/formulaic/pull/123 \
    mkst/zte-config-utility/pull/53 \
    pcdshub/pcdsutils/pull/67 \
    scipion-em/scipion-pyworkflow/pull/376 \
    scipion-em/scipion-pyworkflow/pull/387 \
    scipion-em/scipion-pyworkflow/pull/388 \
    seek-oss/aec/pull/393 \
    seek-oss/aec/pull/394 \
    seek-oss/aec/pull/395 \
    seek-oss/aec/pull/402 \
    sodafoundation/delfin/pull/942 \
    "

CMD_FILE=$(mktemp)
BOOSTED_CMD_FILE=$(mktemp)
#FEATURE="${FEATURE:-how suggest describe review gentest}"
FEATURE="${FEATURE:-describe}"
MODELS="${MODELS:-default}"
BASEREF="${BASEREF:-origin/main}"

function command {
    local VERB=$1
    local KEY=$2
    local KIND=$3
    local ARGS=$4
    echo -n "((git checkout $BASEREF test/baselines/$KIND/$KEY/$VERB.json; mkdir -p prev/baselines/$KIND/$KEY/; mv test/baselines/$KIND/$KEY/$VERB.json prev/baselines/$KIND/$KEY/$VERB.json) 2> /dev/null); ";
    echo -n "mkdir -p test/baselines/$KIND/$KEY/; "
    echo -n "./prbot $VERB --pr https://github.com/$KEY --ghCache --deterministic ${ARGS} --dump test/baselines/$KIND/$KEY/$VERB.json > test/baselines/$KIND/$KEY/$VERB.txt"
    echo ""
}

if [[ $FEATURE == *"how"* ]]; then
    for issue in $HOW_ISSUES; do
        if [[ $MODELS == *"default"* ]]; then
            command "how" $issue "default" "$ADDITIONAL_ARGS" >> $CMD_FILE
        fi
        if [[ $MODELS == *"boosted"* ]]; then
            command "how" $issue "boosted" "--model boosted $ADDITIONAL_ARGS" >> $BOOSTED_CMD_FILE
        fi
    done
fi

if [[ $FEATURE == *"suggest"* ]]; then
    for issue in $SUGGEST_ISSUES; do
        if [[ $MODELS == *"default"* ]]; then
            command "suggest" $issue "default" "$ADDITIONAL_ARGS" >> $CMD_FILE
        fi
        if [[ $MODELS == *"boosted"* ]]; then
            command "suggest" $issue "boosted" "--model boosted $ADDITIONAL_ARGS" >> $BOOSTED_CMD_FILE
        fi
    done
fi

if [[ $FEATURE == *"describe"* ]]; then
    for pull in $DESCRIBE_AND_REVIEW_PULLS; do
        if [[ $MODELS == *"default"* ]]; then
            command "describe" $pull "default" "$ADDITIONAL_ARGS" >> $CMD_FILE
        fi
        if [[ $MODELS == *"boosted"* ]]; then
            command "describe" $pull "boosted" "--model boosted $ADDITIONAL_ARGS" >> $BOOSTED_CMD_FILE
        fi
    done
fi

if [[ $FEATURE == *"review"* ]]; then
    for pull in $DESCRIBE_AND_REVIEW_PULLS; do
        if [[ $MODELS == *"default"* ]]; then
            command "review" $pull "default" "$ADDITIONAL_ARGS" >> $CMD_FILE
        fi
        if [[ $MODELS == *"boosted"* ]]; then
            command "review" $pull "boosted" "--model boosted $ADDITIONAL_ARGS" >> $BOOSTED_CMD_FILE
        fi
    done
fi

if [[ $FEATURE == *"gentest"* ]]; then
    for pull in $GENTEST_PULLS; do
        if [[ $MODELS == *"default"* ]]; then
            command "gentest" $pull "default" "--noLimit --verbose $ADDITIONAL_ARGS" >> $CMD_FILE
        fi
        if [[ $MODELS == *"boosted"* ]]; then
            command "gentest" $pull "boosted" "--noLimit --verbose $ADDITIONAL_ARGS" >> $BOOSTED_CMD_FILE
        fi
    done
fi

npm run build

if [[ $MODELS == *"default"* ]]; then
    echo "Default model"
    NUM_JOBS="${PARALLELISM:-10}"
    parallel -u --jobs ${NUM_JOBS} --eta < $CMD_FILE
    npm run tabulate_baselines test/baselines/default
fi

if [[ $MODELS == *"boosted"* ]]; then
    echo "Boosted model"
    NUM_JOBS="${BOOSTED_PARALLELISM:-4}"
    parallel -u --jobs ${NUM_JOBS} --eta < $BOOSTED_CMD_FILE
    npm run tabulate_baselines test/baselines/boosted
fi

if [[ $FEATURE == *"describe"* ]]; then
    if [[ $MODELS == *"default"* ]]; then
        echo "updating scores for default..."
        (cd scorer && pipenv run --python `which python3` python main.py ../prev/baselines/default)
        (cd scorer && pipenv run --python `which python3` python main.py ../test/baselines/default)
        ./prbot-engine describe-score --old "prev/baselines/default" --new "test/baselines/default" | tee test/scores/default/describe-score.md
    fi
    if [[ $MODELS == *"boosted"* ]]; then
        echo "updating scores for boosted..."
        (cd scorer && pipenv run --python `which python3` python main.py ../prev/baselines/boosted )
        (cd scorer && pipenv run --python `which python3` python main.py ../test/baselines/boosted)
        ./prbot-engine describe-score --old "prev/baselines/boosted" --new "test/baselines/boosted" | tee test/scores/boosted/describe-score.md
    fi
fi

if [[ $FEATURE == *"gentest"* ]]; then
    if [[ $MODELS == *"default"* ]]; then
        echo "aggregating gentest performance..."
        (cd scorer && pipenv run --python `which python3` python gentest.py ../test/baselines/default)
    fi
    if [[ $MODELS == *"boosted"* ]]; then
        echo "aggregating gentest performance..."
        (cd scorer && pipenv run --python `which python3` python gentest.py ../test/baselines/boosted)
    fi
fi

# check if there are "work limit reached" messages in any of the log files
SCRIPTDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
if grep -Rq "work limit reached" $SCRIPTDIR/baselines; then
    echo "Work limit reached for the following logs:"
    grep -Rl "work limit reached" $SCRIPTDIR/baselines | sed "s,^$SCRIPTDIR/baselines/,  ,"
fi

rm $CMD_FILE
rm $BOOSTED_CMD_FILE
