@include('include.header')
<section class="section pt-3">
   <div class="container">
     
      <nav class="breadcrumb" aria-label="breadcrumbs">

      </nav>

   </div>
   <hr/>
   <div class="container">
   <div class="content">
   <h1>{{$tournament->name}}</h1>
  <span class="tag is-black">Ends in {{$tournament->ends_in_time}}</span>
   
   <p>{{$tournament->description}}</p>
   
   <x-topic-leaderboard :topic="$tournament" :limit="10" />
   
   
   
   
   
   </div>
   

      @if($nodes!=FALSE)
      @foreach ($nodes as $node)
      <a href="{{route('view-tournament-task',['id' => $tournament->id,'node_id'=>$node->id])}}">
         @if($node->status=='success')
         <article class="media box has-background-success-light">
         @elseif($node->status=='fail')
         <article class="media box has-background-danger-light">
         @else
         <article class="media box">
         @endif

            <div class="media-content ">
               <div class="content">
                  <p>
                     <strong class="is-size-4">
                     {{$node->lesson->name}}
                     </strong>
                     <br>
                     {!! $node->lesson->description !!}
                  </p>
               </div>
            </div>
            <div class="media-right">
               @if($node->topic_node_condition)
               @if($node->topic_node_condition->type=='timeout')
               @if($node->status=='todo')
               <p>
               <div class="fa-1x">
                  <span class="icon-text is-size-5 is-align-items-center">
                  <span>{{$node->topic_node_condition->time_left}} min.</span>
                  @if($node->topic_node_condition->time_left_progress>60)
                  <span class="icon is-large">
                  <i class="fas fa-hourglass fa-spin"></i>
                  </span>
                  <progress class="progress is-success" value="{{$node->topic_node_condition->time_left_progress}}" max="100">{{$node->topic_node_condition->time_left_progress}} %.</progress>
                  @elseif($node->topic_node_condition->time_left_progress <= 60 && $node->topic_node_condition->time_left_progress>30)
                  <span class="icon is-large">
                  <i class="fas fa-hourglass-half fa-spin"></i>
                  </span>
                  <progress class="progress is-warning" value="{{$node->topic_node_condition->time_left_progress}}" max="100">{{$node->topic_node_condition->time_left_progress}} %.</progress>
                  @else
                  <span class="icon is-large">
                  <i class="far fa-hourglass fa-spin"></i>
                  </span>
                  <progress class="progress is-danger" value="{{$node->topic_node_condition->time_left_progress}}" max="100">{{$node->topic_node_condition->time_left_progress}} %.</progress>
                  @endif
                  </span>
               </div>
               </p>
               @elseif($node->status==FALSE)
               <p>
                  <span class="icon-text is-size-5 is-align-items-center">
                  <span>{{$node->topic_node_condition->time_left}} min.</span>
                  <span class="icon is-large">
                  <i class="fas fa-hourglass"></i>
                  </span>
                  </span>
               </p>
               @endif
               @endif
               @endif
               @if($node->status=='success')
               <p>
                  <span class="icon-text is-size-5 is-align-items-center">
                  <span class="icon is-large">
                  <i class="fas fa-check fa-lg"></i>
                  </span>
                  </span>
               </p>
               @endif
               @if($node->status=='fail')
               <p>
                  <span class="icon-text is-size-5 is-align-items-center">
                  <span class="icon is-large">
                  <i class="fas fa-ban fa-lg"></i>
                  </span>
                  </span>
               </p>
               @endif
            </div>
         </article>
      </a>
      <br/>
      @endforeach
      @endif


   
   
   
   </div>
</section>
@include('include.footer')