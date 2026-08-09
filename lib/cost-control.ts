export type GenerationMode="economy"|"enhanced";

export type Usage={inputTokens:number;outputTokens:number;totalTokens:number};

const rates={
  "gpt-5.6-luna":{input:0.2,output:1.2},
  "gpt-5.6-terra":{input:2,output:12},
  "gpt-5.6-sol":{input:5,output:30},
} as const;

export function generationRoute(mode:GenerationMode){
  return mode==="enhanced"
    ?{model:"gpt-5.6-terra" as const,effort:"medium" as const,imageDetail:"high" as const,reason:"Enhanced review was explicitly approved."}
    :{model:"gpt-5.6-luna" as const,effort:"low" as const,imageDetail:"low" as const,reason:"Routine item within the economy photo limit."};
}

function whole(value:unknown){const number=Number(value);return Number.isFinite(number)&&number>0?Math.round(number):0}

export function usageFromResponse(value:any):Usage{
  const inputTokens=whole(value?.input_tokens),outputTokens=whole(value?.output_tokens);
  return{inputTokens,outputTokens,totalTokens:whole(value?.total_tokens)||inputTokens+outputTokens};
}

export function estimatedCostUsd(model:keyof typeof rates,usage:Usage){
  const rate=rates[model];
  return Number(((usage.inputTokens*rate.input+usage.outputTokens*rate.output)/1_000_000).toFixed(6));
}

export function formatEstimatedCost(cost:number){return cost<0.01?"<$0.01":`$${cost.toFixed(2)}`}
