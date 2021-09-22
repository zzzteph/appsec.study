<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTopicNodeRoutesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('topic_node_routes', function (Blueprint $table) {
            $table->id();
			$table->enum('condition', ['success', 'fail','none'])->default('none');
			$table->unsignedBigInteger('from_id');
			$table->unsignedBigInteger('to_id');
			 $table->foreign('from_id')->references('id')->on('topic_nodes') ->constrained()      ->onUpdate('cascade')      ->onDelete('cascade');
			$table->foreign('to_id')->references('id')->on('topic_nodes')      ->onUpdate('cascade')      ->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('topic_node_routes');
    }
}
